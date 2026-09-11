<!-- app/pages/admin/huds/index.vue -->
<!-- HUD Products list - redesigned header/table to match the client's
     reference mockup (doc/IMG_20260907_165143.jpg): search + category +
     status filters, Situations AND Screens count columns, bottom stat
     row. The nested situations/screens/pop-ups editor stays on its own
     page (app/pages/admin/huds/[id].vue) rather than an inline tabbed
     panel - that editor already handles 3 levels of nesting in one
     scrollable view, which is clearer than picking a "current situation"
     to switch tabs around; restructuring working, verified UX just to
     chase the mockup's tab layout would trade a proven pattern for a
     worse one. -->
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Category, Hud } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type HudRow = Omit<Hud, 'situations'> & { categoryName: string, situationsCount: number, screensCount: number }

const toast = useToast()
const { data, refresh, status: fetchStatus } = await useFetch<{ items: HudRow[] }>('/api/admin/huds')
const { data: categoriesData } = await useFetch<{ items: Category[] }>('/api/admin/categories')

const search = ref('')
const categoryFilter = ref('all')
const statusFilter = ref<'all' | 'draft' | 'published'>('all')
const filteredItems = computed(() => (data.value?.items ?? []).filter((h) => {
	const matchesSearch = !search.value || h.title.toLowerCase().includes(search.value.toLowerCase())
	const matchesCategory = categoryFilter.value === 'all' || h.categoryId === categoryFilter.value
	const matchesStatus = statusFilter.value === 'all' || h.status === statusFilter.value
	return matchesSearch && matchesCategory && matchesStatus
}))

const isModalOpen = ref(false)
const form = reactive({ title: '', description: '', price: 0, categoryId: '' })
const saving = ref(false)

function openCreate() {
	form.title = ''
	form.description = ''
	form.price = 0
	form.categoryId = categoriesData.value?.items?.[0]?.id ?? ''
	isModalOpen.value = true
}

async function onSave() {
	if (!form.title.trim() || !form.categoryId) {
		toast.add({ title: 'Title and category are required', color: 'error' })
		return
	}

	saving.value = true
	try {
		const created = await $fetch<Hud>('/api/admin/huds', { method: 'POST', body: { ...form } })
		toast.add({ title: 'HUD created - add situations on its detail page', color: 'success' })
		isModalOpen.value = false
		await navigateTo(`/admin/huds/${created.id}`)
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Save failed', color: 'error' })
	} finally {
		saving.value = false
	}
}

async function togglePublish(hud: HudRow) {
	const nextStatus = hud.status === 'published' ? 'draft' : 'published'
	try {
		await $fetch(`/api/admin/huds/${hud.id}`, { method: 'PATCH', body: { status: nextStatus } })
		toast.add({ title: nextStatus === 'published' ? 'HUD published' : 'HUD unpublished', color: 'success' })
		await refresh()
	} catch {
		toast.add({ title: 'Action failed', color: 'error' })
	}
}

async function onDelete(hud: HudRow) {
	if (!confirm(`Delete HUD "${hud.title}"?`)) return

	try {
		await $fetch(`/api/admin/huds/${hud.id}`, { method: 'DELETE' })
		toast.add({ title: 'HUD deleted', color: 'success' })
		await refresh()
	} catch {
		toast.add({ title: 'Delete failed', color: 'error' })
	}
}

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<HudRow>[] = [
	{ accessorKey: 'title', header: 'HUD Name' },
	{ accessorKey: 'categoryName', header: 'Category' },
	{ accessorKey: 'price', header: 'Price', cell: ({ row }) => `$${row.original.price}` },
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => h(UBadge, {
			color: row.original.status === 'published' ? 'success' : 'neutral',
			variant: 'subtle'
		}, () => row.original.status)
	},
	{ accessorKey: 'situationsCount', header: 'Situations' },
	{ accessorKey: 'screensCount', header: 'Screens' },
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
			h(UButton, { size: 'xs', color: 'primary', variant: 'soft', to: `/admin/huds/${row.original.id}` }, () => 'Edit'),
			h(UButton, {
				size: 'xs',
				color: row.original.status === 'published' ? 'warning' : 'success',
				variant: 'soft',
				onClick: () => togglePublish(row.original)
			}, () => row.original.status === 'published' ? 'Unpublish' : 'Publish'),
			h(UButton, { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDelete(row.original) }, () => 'Delete')
		])
	}
]

const stats = computed(() => {
	const items = data.value?.items ?? []
	return {
		total: items.length,
		published: items.filter(h => h.status === 'published').length,
		draft: items.filter(h => h.status === 'draft').length,
		totalSituations: items.reduce((sum, h) => sum + h.situationsCount, 0)
	}
})
</script>

<template>
	<div class="flex flex-col gap-6">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<h1 class="text-xl font-semibold">HUDs <span class="text-muted font-normal">Management</span></h1>
			<div class="flex flex-wrap gap-2">
				<UInput v-model="search" icon="material-symbols:search" placeholder="Search HUDs..." />
				<USelect
					v-model="categoryFilter" class="w-40"
					:items="[{ label: 'Category: All', value: 'all' }, ...(categoriesData?.items ?? []).map(c => ({ label: c.name, value: c.id }))]"
				/>
				<USelect v-model="statusFilter" class="w-36" :items="[{ label: 'Status: All', value: 'all' }, { label: 'Published', value: 'published' }, { label: 'Draft', value: 'draft' }]" />
				<UButton icon="material-symbols:add" @click="openCreate">Add New HUD</UButton>
			</div>
		</div>

		<UTable :data="filteredItems" :columns="columns" :loading="fetchStatus === 'pending'" />

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<AdminStatCard label="Total HUDs" :value="stats.total" icon="material-symbols:widgets" color="blue" />
			<AdminStatCard label="Published" :value="stats.published" icon="material-symbols:check-circle-outline" color="green" />
			<AdminStatCard label="Draft" :value="stats.draft" icon="material-symbols:edit-note" color="orange" />
			<AdminStatCard label="Total Situations" :value="stats.totalSituations" icon="material-symbols:view-list" color="purple" />
		</div>

		<UModal v-model:open="isModalOpen" title="New HUD">
			<template #body>
				<form class="flex flex-col gap-4" @submit.prevent="onSave">
					<UFormField label="Title">
						<UInput v-model="form.title" class="w-full" placeholder="e.g. Cash Grinder HUD" />
					</UFormField>
					<UFormField label="Description">
						<UTextarea v-model="form.description" class="w-full" :rows="3" />
					</UFormField>
					<UFormField label="Price ($)">
						<UInput v-model.number="form.price" type="number" class="w-full" />
					</UFormField>
					<UFormField label="Category">
						<USelect
							v-model="form.categoryId"
							class="w-full"
							:items="(categoriesData?.items ?? []).map(c => ({ label: c.name, value: c.id }))"
						/>
					</UFormField>
					<div class="flex justify-end gap-2">
						<UButton color="neutral" variant="ghost" @click="isModalOpen = false">Cancel</UButton>
						<UButton type="submit" :loading="saving">Create</UButton>
					</div>
				</form>
			</template>
		</UModal>
	</div>
</template>
