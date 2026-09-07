<!-- app/pages/admin/categories/index.vue -->
<!-- Categories - redesigned to match the client's reference mockup
     (doc/IMG_20260907_170016.jpg): search + status filter + Add button
     header, a table, and a master-detail panel below it (click a row to
     open Overview/HUDs/Edit tabs) instead of the old modal-only pattern.
     Bottom row is colorful stat cards. This is the reference module for
     the master-detail pattern every other list page follows. -->
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { CategoryStatus } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type CategoryRow = {
	id: string, name: string, slug: string, sortOrder: number,
	description: string, status: CategoryStatus, createdAt: string, hudCount: number
}

const toast = useToast()
const { data, refresh, status: fetchStatus } = await useFetch<{ items: CategoryRow[] }>('/api/admin/categories')

// --- search + filter ---
const search = ref('')
const statusFilter = ref<'all' | CategoryStatus>('all')
const filteredItems = computed(() => {
	return (data.value?.items ?? []).filter((c) => {
		const matchesSearch = !search.value || c.name.toLowerCase().includes(search.value.toLowerCase())
		const matchesStatus = statusFilter.value === 'all' || c.status === statusFilter.value
		return matchesSearch && matchesStatus
	})
})

// --- master-detail ---
const selected = ref<CategoryRow | null>(null)
const detailTab = ref<'overview' | 'huds' | 'edit'>('overview')

function selectCategory(category: CategoryRow) {
	selected.value = category
	detailTab.value = 'overview'
	editForm.name = category.name
	editForm.description = category.description
	editForm.sortOrder = category.sortOrder
}

// --- create modal ---
const isCreateOpen = ref(false)
const createForm = reactive({ name: '', description: '', sortOrder: 1 })
const saving = ref(false)

function openCreate() {
	createForm.name = ''
	createForm.description = ''
	createForm.sortOrder = (data.value?.items?.length ?? 0) + 1
	isCreateOpen.value = true
}

async function onCreate() {
	if (!createForm.name.trim()) {
		toast.add({ title: 'Name is required', color: 'error' })
		return
	}
	saving.value = true
	try {
		await $fetch('/api/admin/categories', { method: 'POST', body: { ...createForm } })
		toast.add({ title: 'Category created', color: 'success' })
		isCreateOpen.value = false
		await refresh()
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Save failed', color: 'error' })
	} finally {
		saving.value = false
	}
}

// --- edit (in the detail panel) ---
const editForm = reactive({ name: '', description: '', sortOrder: 1 })
async function onSaveEdit() {
	if (!selected.value) return
	saving.value = true
	try {
		await $fetch(`/api/admin/categories/${selected.value.id}`, { method: 'PATCH', body: { ...editForm } })
		toast.add({ title: 'Category updated', color: 'success' })
		await refresh()
		selected.value = data.value?.items.find(c => c.id === selected.value!.id) ?? null
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Save failed', color: 'error' })
	} finally {
		saving.value = false
	}
}

async function toggleStatus(category: CategoryRow) {
	const nextStatus = category.status === 'active' ? 'inactive' : 'active'
	try {
		await $fetch(`/api/admin/categories/${category.id}`, { method: 'PATCH', body: { status: nextStatus } })
		toast.add({ title: nextStatus === 'active' ? 'Category activated' : 'Category disabled', color: 'success' })
		await refresh()
		if (selected.value?.id === category.id) selected.value = { ...selected.value, status: nextStatus }
	} catch {
		toast.add({ title: 'Action failed', color: 'error' })
	}
}

async function onDelete(category: CategoryRow) {
	if (!confirm(`Delete category "${category.name}"?`)) return
	try {
		await $fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' })
		toast.add({ title: 'Category deleted', color: 'success' })
		if (selected.value?.id === category.id) selected.value = null
		await refresh()
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Delete failed', color: 'error' })
	}
}

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<CategoryRow>[] = [
	{ accessorKey: 'name', header: 'Category Name' },
	{ accessorKey: 'description', header: 'Description', cell: ({ row }) => h('span', { class: 'truncate block max-w-48' }, row.original.description || '—') },
	{ accessorKey: 'hudCount', header: 'HUD Count' },
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => h(UBadge, { color: row.original.status === 'active' ? 'success' : 'neutral', variant: 'subtle' }, () => row.original.status)
	},
	{ accessorKey: 'createdAt', header: 'Created On', cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() },
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
			h(UButton, { size: 'xs', color: 'primary', variant: 'soft', onClick: () => selectCategory(row.original) }, () => 'View'),
			h(UButton, {
				size: 'xs', color: row.original.status === 'active' ? 'neutral' : 'success', variant: 'soft',
				onClick: () => toggleStatus(row.original)
			}, () => row.original.status === 'active' ? 'Disable' : 'Activate'),
			h(UButton, { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDelete(row.original) }, () => 'Delete')
		])
	}
]

const stats = computed(() => {
	const items = data.value?.items ?? []
	return {
		total: items.length,
		active: items.filter(c => c.status === 'active').length,
		inactive: items.filter(c => c.status === 'inactive').length,
		totalHuds: items.reduce((sum, c) => sum + c.hudCount, 0)
	}
})
</script>

<template>
	<div class="flex flex-col gap-6">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<div>
				<h1 class="text-xl font-semibold">Categories <span class="text-muted font-normal">Management</span></h1>
			</div>
			<div class="flex flex-wrap gap-2">
				<UInput v-model="search" icon="material-symbols:search" placeholder="Search categories..." />
				<USelect v-model="statusFilter" class="w-36" :items="[{ label: 'Status: All', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]" />
				<UButton icon="material-symbols:add" @click="openCreate">Add New Category</UButton>
			</div>
		</div>

		<UTable :data="filteredItems" :columns="columns" :loading="fetchStatus === 'pending'" />

		<UCard v-if="selected">
			<template #header>
				<div class="flex items-center justify-between">
					<p class="font-medium">Category: {{ selected.name }}</p>
					<UButton size="xs" color="neutral" variant="ghost" icon="material-symbols:close" @click="selected = null" />
				</div>
			</template>

			<div class="flex gap-1 border-b border-default mb-4">
				<button
					v-for="tab in [['overview','Overview'],['huds','HUDs'],['edit','Edit']] as const" :key="tab[0]"
					class="px-3 py-2 text-sm border-b-2 -mb-px"
					:class="detailTab === tab[0] ? 'border-primary text-primary font-medium' : 'border-transparent text-muted'"
					@click="detailTab = tab[0]"
				>{{ tab[1] }}</button>
			</div>

			<div v-if="detailTab === 'overview'" class="flex flex-col gap-2 text-sm">
				<p><span class="text-muted">Name:</span> {{ selected.name }}</p>
				<p><span class="text-muted">Description:</span> {{ selected.description || '—' }}</p>
				<p><span class="text-muted">Status:</span> <UBadge :color="selected.status === 'active' ? 'success' : 'neutral'" variant="subtle">{{ selected.status }}</UBadge></p>
				<p><span class="text-muted">HUD Count:</span> {{ selected.hudCount }}</p>
				<p><span class="text-muted">Created On:</span> {{ new Date(selected.createdAt).toLocaleDateString() }}</p>
			</div>

			<div v-else-if="detailTab === 'huds'">
				<p class="text-sm text-muted">HUDs in this category are managed from the HUD Products page.</p>
				<UButton class="mt-3" size="sm" :to="`/admin/huds`" color="neutral" variant="soft">Go to HUD Products</UButton>
			</div>

			<form v-else class="flex flex-col gap-4 max-w-md" @submit.prevent="onSaveEdit">
				<UFormField label="Name"><UInput v-model="editForm.name" class="w-full" /></UFormField>
				<UFormField label="Description"><UTextarea v-model="editForm.description" class="w-full" :rows="2" /></UFormField>
				<UFormField label="Sort Order"><UInput v-model.number="editForm.sortOrder" type="number" class="w-full" /></UFormField>
				<UButton type="submit" class="self-start" :loading="saving">Save Changes</UButton>
			</form>
		</UCard>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<AdminStatCard label="Total Categories" :value="stats.total" icon="material-symbols:category" color="blue" />
			<AdminStatCard label="Active Categories" :value="stats.active" icon="material-symbols:check-circle-outline" color="green" />
			<AdminStatCard label="Inactive Categories" :value="stats.inactive" icon="material-symbols:pause-circle-outline" color="orange" />
			<AdminStatCard label="Total HUDs" :value="stats.totalHuds" icon="material-symbols:widgets-outline" color="red" />
		</div>

		<UModal v-model:open="isCreateOpen" title="New Category">
			<template #body>
				<form class="flex flex-col gap-4" @submit.prevent="onCreate">
					<UFormField label="Name"><UInput v-model="createForm.name" class="w-full" placeholder="e.g. Cash" /></UFormField>
					<UFormField label="Description"><UTextarea v-model="createForm.description" class="w-full" :rows="2" /></UFormField>
					<UFormField label="Sort Order"><UInput v-model.number="createForm.sortOrder" type="number" class="w-full" /></UFormField>
					<div class="flex justify-end gap-2">
						<UButton color="neutral" variant="ghost" @click="isCreateOpen = false">Cancel</UButton>
						<UButton type="submit" :loading="saving">Save</UButton>
					</div>
				</form>
			</template>
		</UModal>
	</div>
</template>
