<!-- app/pages/admin/users/index.vue -->
<!-- Users (customers) CRUD - same list/modal/delete pattern as
     app/pages/admin/categories/index.vue, plus a dedicated ban/unban
     quick action per PROJECTDOC.md section 3.2. -->
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Customer } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type CustomerRow = Customer & { referredByName: string | null }

const toast = useToast()
const { data, refresh, status: fetchStatus } = await useFetch<{ items: CustomerRow[] }>('/api/admin/users')

const isModalOpen = ref(false)
const editingUser = ref<CustomerRow | null>(null)
const form = reactive({ name: '', email: '' })
const saving = ref(false)

function openCreate() {
	editingUser.value = null
	form.name = ''
	form.email = ''
	isModalOpen.value = true
}

function openEdit(user: CustomerRow) {
	editingUser.value = user
	form.name = user.name
	form.email = user.email
	isModalOpen.value = true
}

async function onSave() {
	if (!form.name.trim() || !form.email.trim()) {
		toast.add({ title: 'Name and email are required', color: 'error' })
		return
	}

	saving.value = true
	try {
		if (editingUser.value) {
			await $fetch(`/api/admin/users/${editingUser.value.id}`, {
				method: 'PATCH',
				body: { name: form.name, email: form.email }
			})
			toast.add({ title: 'User updated', color: 'success' })
		} else {
			await $fetch('/api/admin/users', {
				method: 'POST',
				body: { name: form.name, email: form.email }
			})
			toast.add({ title: 'User created', color: 'success' })
		}
		isModalOpen.value = false
		await refresh()
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Save failed', color: 'error' })
	} finally {
		saving.value = false
	}
}

async function toggleBan(user: CustomerRow) {
	const nextStatus = user.status === 'active' ? 'banned' : 'active'
	try {
		await $fetch(`/api/admin/users/${user.id}`, { method: 'PATCH', body: { status: nextStatus } })
		toast.add({ title: nextStatus === 'banned' ? 'User banned' : 'User unbanned', color: 'success' })
		await refresh()
	} catch {
		toast.add({ title: 'Action failed', color: 'error' })
	}
}

async function onDelete(user: CustomerRow) {
	if (!confirm(`Delete user "${user.name}"?`)) return

	try {
		await $fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
		toast.add({ title: 'User deleted', color: 'success' })
		await refresh()
	} catch {
		toast.add({ title: 'Delete failed', color: 'error' })
	}
}

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<CustomerRow>[] = [
	{ accessorKey: 'name', header: 'Name' },
	{ accessorKey: 'email', header: 'Email' },
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => h(UBadge, {
			color: row.original.status === 'active' ? 'success' : 'error',
			variant: 'subtle'
		}, () => row.original.status)
	},
	{
		accessorKey: 'referredByName',
		header: 'Referred By',
		cell: ({ row }) => row.original.referredByName ?? '—'
	},
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
			h(UButton, { size: 'xs', color: 'neutral', variant: 'soft', onClick: () => openEdit(row.original) }, () => 'Edit'),
			h(UButton, {
				size: 'xs',
				color: row.original.status === 'active' ? 'warning' : 'success',
				variant: 'soft',
				onClick: () => toggleBan(row.original)
			}, () => row.original.status === 'active' ? 'Ban' : 'Unban'),
			h(UButton, { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDelete(row.original) }, () => 'Delete')
		])
	}
]
</script>

<template>
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-xl font-semibold">Users</h1>
				<p class="text-sm text-muted">Customer accounts. Password reset needs real auth - deferred (see PROJECTDOC.md section 7).</p>
			</div>
			<UButton icon="material-symbols:add" @click="openCreate">New User</UButton>
		</div>

		<UTable :data="data?.items ?? []" :columns="columns" :loading="fetchStatus === 'pending'" />

		<UModal v-model:open="isModalOpen" :title="editingUser ? 'Edit User' : 'New User'">
			<template #body>
				<form class="flex flex-col gap-4" @submit.prevent="onSave">
					<UFormField label="Name">
						<UInput v-model="form.name" class="w-full" placeholder="e.g. Alice" />
					</UFormField>
					<UFormField label="Email">
						<UInput v-model="form.email" type="email" class="w-full" placeholder="alice@example.com" />
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
