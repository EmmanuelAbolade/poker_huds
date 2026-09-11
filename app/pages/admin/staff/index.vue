<!-- app/pages/admin/staff/index.vue -->
<!-- Staff (console) accounts - distinct from Users (customers). Same
     list/modal/delete pattern as every other CRUD module. super_admin
     only, both here (redirect if not) and server-side (server/api/
     admin/admin-users/* all call requireRole(['super_admin'])) - the
     page-level check is just so a non-super_admin sees a clear message
     instead of a raw 403 from a failed fetch. -->
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { AdminRole } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type AdminUserRow = { id: string, name: string, email: string, role: AdminRole, createdAt: string }

const { user: currentUser } = useAdminAuth()
const toast = useToast()

const isAllowed = computed(() => currentUser.value?.role === 'super_admin')

const { data, refresh, status: fetchStatus } = await useFetch<{ items: AdminUserRow[] }>('/api/admin/admin-users', {
	immediate: isAllowed.value
})

const isModalOpen = ref(false)
const editingAdmin = ref<AdminUserRow | null>(null)
const form = reactive({ name: '', email: '', role: 'admin' as AdminRole })
const saving = ref(false)

const roleOptions = [
	{ label: 'Super Admin', value: 'super_admin' },
	{ label: 'Admin', value: 'admin' },
	{ label: 'Moderator', value: 'moderator' }
]

function openCreate() {
	editingAdmin.value = null
	form.name = ''
	form.email = ''
	form.role = 'admin'
	isModalOpen.value = true
}

function openEdit(admin: AdminUserRow) {
	editingAdmin.value = admin
	form.name = admin.name
	form.role = admin.role
	isModalOpen.value = true
}

async function onSave() {
	saving.value = true
	try {
		if (editingAdmin.value) {
			await $fetch(`/api/admin/admin-users/${editingAdmin.value.id}`, { method: 'PATCH', body: { name: form.name, role: form.role } })
			toast.add({ title: 'Admin updated', color: 'success' })
		} else {
			await $fetch('/api/admin/admin-users', { method: 'POST', body: { ...form } })
			toast.add({ title: 'Admin created - logs in with the same mock password (admin123)', color: 'success' })
		}
		isModalOpen.value = false
		await refresh()
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Save failed', color: 'error' })
	} finally {
		saving.value = false
	}
}

async function onDelete(admin: AdminUserRow) {
	if (!confirm(`Delete admin "${admin.name}"?`)) return
	try {
		await $fetch(`/api/admin/admin-users/${admin.id}`, { method: 'DELETE' })
		toast.add({ title: 'Admin deleted', color: 'success' })
		await refresh()
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Delete failed', color: 'error' })
	}
}

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const roleColor: Record<AdminRole, 'error' | 'warning' | 'neutral'> = {
	super_admin: 'error',
	admin: 'warning',
	moderator: 'neutral'
}

const columns: TableColumn<AdminUserRow>[] = [
	{ accessorKey: 'name', header: 'Name' },
	{ accessorKey: 'email', header: 'Email' },
	{
		accessorKey: 'role',
		header: 'Role',
		cell: ({ row }) => h(UBadge, { color: roleColor[row.original.role], variant: 'subtle' }, () => row.original.role)
	},
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
		<div v-if="!isAllowed">
			<h1 class="text-xl font-semibold">Staff Accounts</h1>
			<UAlert class="mt-4" color="error" variant="soft" title="Super Admin only" description="Your role doesn't have access to staff account management." />
		</div>

		<template v-else>
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-xl font-semibold">Staff Accounts</h1>
					<p class="text-sm text-muted">Console access for admins/moderators - separate from Users (customers). All log in with the same mock password until real auth exists.</p>
				</div>
				<UButton icon="material-symbols:add" @click="openCreate">New Admin</UButton>
			</div>

			<UTable :data="data?.items ?? []" :columns="columns" :loading="fetchStatus === 'pending'" />

			<UModal v-model:open="isModalOpen" :title="editingAdmin ? 'Edit Admin' : 'New Admin'">
				<template #body>
					<form class="flex flex-col gap-4" @submit.prevent="onSave">
						<UFormField label="Name">
							<UInput v-model="form.name" class="w-full" />
						</UFormField>
						<UFormField label="Email" v-if="!editingAdmin">
							<UInput v-model="form.email" type="email" class="w-full" />
						</UFormField>
						<UFormField label="Role">
							<USelect v-model="form.role" class="w-full" :items="roleOptions" />
						</UFormField>
						<div class="flex justify-end gap-2">
							<UButton color="neutral" variant="ghost" @click="isModalOpen = false">Cancel</UButton>
							<UButton type="submit" :loading="saving">Save</UButton>
						</div>
					</form>
				</template>
			</UModal>
		</template>
	</div>
</template>
