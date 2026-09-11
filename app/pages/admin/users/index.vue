<!-- app/pages/admin/users/index.vue -->
<!-- Users - redesigned to match the client's reference mockup (doc/
     IMG_20260907_165009.jpg): search + status filter + Add button
     header, a table with real purchase/referral counts, and a master-
     detail panel (user info + actions on the left, Recent Purchases +
     Referral Stats with a mini tree on the right) instead of the old
     modal-only pattern. -->
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type UserRow = {
	id: string, name: string, email: string, status: 'active' | 'banned',
	referredByUserId: string | null, referredByName: string | null, createdAt: string,
	purchaseCount: number, referralCount: number
}

type UserDetail = {
	id: string, name: string, email: string, status: 'active' | 'banned', createdAt: string
	purchases: { id: string, hudTitle: string, amount: number, status: string, purchasedAt: string, licenseExpiresAt: string | null, licenseStatus: string | null }[]
	referrals: { total: number, totalEarnings: number, direct: string[], sub: string[] }
}

const toast = useToast()
const { data, refresh, status: fetchStatus } = await useFetch<{ items: UserRow[] }>('/api/admin/users')

const search = ref('')
const statusFilter = ref<'all' | 'active' | 'banned'>('all')
const filteredItems = computed(() => (data.value?.items ?? []).filter((u) => {
	const matchesSearch = !search.value || u.name.toLowerCase().includes(search.value.toLowerCase()) || u.email.toLowerCase().includes(search.value.toLowerCase())
	const matchesStatus = statusFilter.value === 'all' || u.status === statusFilter.value
	return matchesSearch && matchesStatus
}))

const selected = ref<UserDetail | null>(null)
const detailLoading = ref(false)
async function selectUser(user: UserRow) {
	detailLoading.value = true
	try {
		selected.value = await $fetch<UserDetail>(`/api/admin/users/${user.id}`)
	} finally {
		detailLoading.value = false
	}
}

const isCreateOpen = ref(false)
const createForm = reactive({ name: '', email: '' })
const saving = ref(false)

function openCreate() {
	createForm.name = ''
	createForm.email = ''
	isCreateOpen.value = true
}

async function onCreate() {
	if (!createForm.name.trim() || !createForm.email.trim()) {
		toast.add({ title: 'Name and email are required', color: 'error' })
		return
	}
	saving.value = true
	try {
		await $fetch('/api/admin/users', { method: 'POST', body: { ...createForm } })
		toast.add({ title: 'User created', color: 'success' })
		isCreateOpen.value = false
		await refresh()
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Save failed', color: 'error' })
	} finally {
		saving.value = false
	}
}

async function toggleBan(user: { id: string, status: 'active' | 'banned' }) {
	const nextStatus = user.status === 'active' ? 'banned' : 'active'
	try {
		await $fetch(`/api/admin/users/${user.id}`, { method: 'PATCH', body: { status: nextStatus } })
		toast.add({ title: nextStatus === 'banned' ? 'User banned' : 'User unbanned', color: 'success' })
		await refresh()
		if (selected.value?.id === user.id) selected.value = { ...selected.value, status: nextStatus }
	} catch {
		toast.add({ title: 'Action failed', color: 'error' })
	}
}

async function onDelete(user: UserRow) {
	if (!confirm(`Delete user "${user.name}"?`)) return
	try {
		await $fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
		toast.add({ title: 'User deleted', color: 'success' })
		if (selected.value?.id === user.id) selected.value = null
		await refresh()
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Delete failed', color: 'error' })
	}
}

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const orderStatusColor: Record<string, 'success' | 'warning' | 'error'> = { paid: 'success', pending: 'warning', refunded: 'error' }

const columns: TableColumn<UserRow>[] = [
	{ accessorKey: 'name', header: 'User Name' },
	{ accessorKey: 'email', header: 'Email' },
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => h(UBadge, { color: row.original.status === 'active' ? 'success' : 'error', variant: 'subtle' }, () => row.original.status)
	},
	{ accessorKey: 'purchaseCount', header: 'Purchases' },
	{ accessorKey: 'referralCount', header: 'Referrals' },
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
			h(UButton, { size: 'xs', color: 'primary', variant: 'soft', onClick: () => selectUser(row.original) }, () => 'View'),
			h(UButton, {
				size: 'xs', color: row.original.status === 'active' ? 'warning' : 'success', variant: 'soft',
				onClick: () => toggleBan(row.original)
			}, () => row.original.status === 'active' ? 'Ban' : 'Unban'),
			h(UButton, { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDelete(row.original) }, () => 'Delete')
		])
	}
]
</script>

<template>
	<div class="flex flex-col gap-6">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<h1 class="text-xl font-semibold">Users <span class="text-muted font-normal">Management</span></h1>
			<div class="flex flex-wrap gap-2">
				<UInput v-model="search" icon="material-symbols:search" placeholder="Search users..." />
				<USelect v-model="statusFilter" class="w-36" :items="[{ label: 'Status: All', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Banned', value: 'banned' }]" />
				<UButton icon="material-symbols:add" @click="openCreate">Add New User</UButton>
			</div>
		</div>

		<UTable :data="filteredItems" :columns="columns" :loading="fetchStatus === 'pending'" />

		<div v-if="selected || detailLoading" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<UCard v-if="selected">
				<template #header>
					<div class="flex items-center justify-between">
						<p class="font-medium">User: {{ selected.name }}</p>
						<UButton size="xs" color="neutral" variant="ghost" icon="material-symbols:close" @click="selected = null" />
					</div>
				</template>
				<div class="flex flex-col gap-2 text-sm mb-4">
					<p><span class="text-muted">Email:</span> {{ selected.email }}</p>
					<p><span class="text-muted">Status:</span> <UBadge :color="selected.status === 'active' ? 'success' : 'error'" variant="subtle">{{ selected.status }}</UBadge></p>
					<p><span class="text-muted">Joined:</span> {{ new Date(selected.createdAt).toLocaleDateString() }}</p>
				</div>
				<div class="flex gap-2 flex-wrap">
					<UButton size="sm" :color="selected.status === 'active' ? 'warning' : 'success'" variant="soft" @click="toggleBan(selected)">
						{{ selected.status === 'active' ? 'Ban User' : 'Unban User' }}
					</UButton>
					<UButton size="sm" color="neutral" variant="soft" disabled title="Needs real auth - see PROJECTDOC.md section 7">Reset Password</UButton>
				</div>
			</UCard>

			<div class="flex flex-col gap-4">
				<UCard>
					<template #header><p class="font-medium">Recent Purchases</p></template>
					<div v-if="!selected?.purchases.length" class="text-sm text-muted">No purchases yet.</div>
					<ul v-else class="flex flex-col gap-2">
						<li v-for="p in selected!.purchases.slice(0, 4)" :key="p.id" class="flex items-center justify-between text-sm">
							<span class="truncate">{{ p.hudTitle }}</span>
							<UBadge :color="orderStatusColor[p.status] ?? 'neutral'" variant="subtle">{{ p.status }}</UBadge>
						</li>
					</ul>
				</UCard>

				<UCard>
					<template #header><p class="font-medium">Referral Stats</p></template>
					<div class="flex items-center justify-between text-sm mb-3">
						<p><span class="text-muted">Total Referrals:</span> <span class="font-semibold">{{ selected?.referrals.total ?? 0 }}</span></p>
						<p><span class="text-muted">Earnings:</span> <span class="font-semibold text-primary">${{ selected?.referrals.totalEarnings ?? 0 }}</span></p>
					</div>
					<div v-if="selected?.referrals.total" class="flex flex-col items-center gap-2">
						<div class="rounded-md bg-elevated px-3 py-1 text-xs font-medium">{{ selected.name }}</div>
						<div class="flex gap-2 flex-wrap justify-center">
							<div v-for="n in selected.referrals.direct" :key="n" class="rounded-md border border-default px-2 py-1 text-xs">{{ n }}</div>
							<div v-for="n in selected.referrals.sub" :key="n" class="rounded-md border border-dashed border-default px-2 py-1 text-xs text-muted">{{ n }}</div>
						</div>
					</div>
				</UCard>
			</div>
		</div>

		<UModal v-model:open="isCreateOpen" title="New User">
			<template #body>
				<form class="flex flex-col gap-4" @submit.prevent="onCreate">
					<UFormField label="Name"><UInput v-model="createForm.name" class="w-full" /></UFormField>
					<UFormField label="Email"><UInput v-model="createForm.email" type="email" class="w-full" /></UFormField>
					<div class="flex justify-end gap-2">
						<UButton color="neutral" variant="ghost" @click="isCreateOpen = false">Cancel</UButton>
						<UButton type="submit" :loading="saving">Save</UButton>
					</div>
				</form>
			</template>
		</UModal>
	</div>
</template>
