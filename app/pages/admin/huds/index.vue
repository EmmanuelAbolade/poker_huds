<!-- app/pages/admin/huds/index.vue -->
<!-- HUD Products list. Basic-field CRUD lives here (create modal, publish
     toggle, delete); the nested situations/screens/pop-ups editor lives on
     the detail page (app/pages/admin/huds/[id].vue) - see that file's
     header comment for why the split. -->
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Category, Hud } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type HudRow = Hud & { categoryName: string }

const toast = useToast()
const { data, refresh, status: fetchStatus } = await useFetch<{ items: HudRow[] }>('/api/admin/huds')
const { data: categoriesData } = await useFetch<{ items: Category[] }>('/api/admin/categories')

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
	{ accessorKey: 'title', header: 'Title' },
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
	{
		id: 'situations',
		header: 'Situations',
		cell: ({ row }) => row.original.situations.length
	},
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
			h(UButton, { size: 'xs', color: 'neutral', variant: 'soft', to: `/admin/huds/${row.original.id}` }, () => 'Manage'),
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
</script>

<template>
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-xl font-semibold">HUD Products</h1>
				<p class="text-sm text-muted">Click "Manage" to edit a HUD's situations, screens and pop-up images.</p>
			</div>
			<UButton icon="material-symbols:add" @click="openCreate">New HUD</UButton>
		</div>

		<UTable :data="data?.items ?? []" :columns="columns" :loading="fetchStatus === 'pending'" />

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
