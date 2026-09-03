<!-- app/pages/admin/categories/index.vue -->
<!-- Categories CRUD - the reference admin module (PROJECTDOC.md section
     5.5). List + create/edit modal + delete, all wired to
     server/api/admin/categories/*. Every future entity module (Users,
     HUDs, Orders, Referrals) follows this same list/modal/delete shape. -->
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Category } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const toast = useToast()
const { data, refresh, status } = await useFetch<{ items: Category[] }>('/api/admin/categories')

const isModalOpen = ref(false)
const editingCategory = ref<Category | null>(null)
const form = reactive({ name: '', sortOrder: 1 })
const saving = ref(false)

function openCreate() {
	editingCategory.value = null
	form.name = ''
	form.sortOrder = (data.value?.items?.length ?? 0) + 1
	isModalOpen.value = true
}

function openEdit(category: Category) {
	editingCategory.value = category
	form.name = category.name
	form.sortOrder = category.sortOrder
	isModalOpen.value = true
}

async function onSave() {
	if (!form.name.trim()) {
		toast.add({ title: 'Name is required', color: 'error' })
		return
	}

	saving.value = true
	try {
		if (editingCategory.value) {
			await $fetch(`/api/admin/categories/${editingCategory.value.id}`, {
				method: 'PATCH',
				body: { name: form.name, sortOrder: form.sortOrder }
			})
			toast.add({ title: 'Category updated', color: 'success' })
		} else {
			await $fetch('/api/admin/categories', {
				method: 'POST',
				body: { name: form.name, sortOrder: form.sortOrder }
			})
			toast.add({ title: 'Category created', color: 'success' })
		}
		isModalOpen.value = false
		await refresh()
	} catch {
		toast.add({ title: 'Save failed', color: 'error' })
	} finally {
		saving.value = false
	}
}

async function onDelete(category: Category) {
	if (!confirm(`Delete category "${category.name}"?`)) return

	try {
		await $fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' })
		toast.add({ title: 'Category deleted', color: 'success' })
		await refresh()
	} catch {
		toast.add({ title: 'Delete failed', color: 'error' })
	}
}

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<Category>[] = [
	{ accessorKey: 'name', header: 'Name' },
	{
		accessorKey: 'slug',
		header: 'Slug',
		cell: ({ row }) => h(UBadge, { color: 'neutral', variant: 'subtle' }, () => row.original.slug)
	},
	{ accessorKey: 'sortOrder', header: 'Sort Order' },
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
			h(UButton, { size: 'xs', color: 'neutral', variant: 'soft', onClick: () => openEdit(row.original) }, () => 'Edit'),
			h(UButton, { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDelete(row.original) }, () => 'Delete')
		])
	}
]
</script>

<template>
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-xl font-semibold">Categories</h1>
				<p class="text-sm text-muted">Storefront categories: Cash, MTT, Spins, PLO, 6+, GTO, Software, Courses.</p>
			</div>
			<UButton icon="material-symbols:add" @click="openCreate">New Category</UButton>
		</div>

		<UTable :data="data?.items ?? []" :columns="columns" :loading="status === 'pending'" />

		<UModal v-model:open="isModalOpen" :title="editingCategory ? 'Edit Category' : 'New Category'">
			<template #body>
				<form class="flex flex-col gap-4" @submit.prevent="onSave">
					<UFormField label="Name">
						<UInput v-model="form.name" class="w-full" placeholder="e.g. Cash" />
					</UFormField>
					<UFormField label="Sort Order">
						<UInput v-model.number="form.sortOrder" type="number" class="w-full" />
					</UFormField>
					<div class="flex justify-end gap-2">
						<UButton color="neutral" variant="ghost" @click="isModalOpen = false">Cancel</UButton>
						<UButton type="submit" :loading="saving">Save</UButton>
					</div>
				</form>
			</template>
		</UModal>
	</div>
</template>
