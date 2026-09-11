<!-- app/pages/admin/orders/index.vue -->
<!-- Orders & Licenses - redesigned to match the client's reference
     mockup (doc/IMG_20260907_170016.jpg style pattern): search + status
     filter + Add button header, table, and a master-detail panel below
     (Overview/License/Actions tabs) instead of everything living only in
     row-level buttons. No "Payment" filter/column - there's no real
     payment-method data (no processor is wired up yet, see PROJECTDOC.md
     section 6 Q3), and showing "Stripe" on every row when nothing is
     actually processed through Stripe would be fabricating data. -->
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Customer, Hud, License, Order } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type OrderRow = Order & { userName: string, hudTitle: string, license: License | null }

const toast = useToast()
const { data, refresh, status: fetchStatus } = await useFetch<{ items: OrderRow[] }>('/api/admin/orders')
const { data: usersData } = await useFetch<{ items: Customer[] }>('/api/admin/users')
const { data: hudsData } = await useFetch<{ items: Hud[] }>('/api/admin/huds')

const search = ref('')
const statusFilter = ref<'all' | Order['status']>('all')
const filteredItems = computed(() => (data.value?.items ?? []).filter((o) => {
	const matchesSearch = !search.value || o.userName.toLowerCase().includes(search.value.toLowerCase()) || o.hudTitle.toLowerCase().includes(search.value.toLowerCase())
	const matchesStatus = statusFilter.value === 'all' || o.status === statusFilter.value
	return matchesSearch && matchesStatus
}))

const selected = ref<OrderRow | null>(null)
const detailTab = ref<'overview' | 'license' | 'actions'>('overview')
function selectOrder(order: OrderRow) {
	selected.value = order
	detailTab.value = 'overview'
}

const isModalOpen = ref(false)
const form = reactive({ userId: '', hudId: '', amount: 0 })
const saving = ref(false)

function openCreate() {
	form.userId = usersData.value?.items?.[0]?.id ?? ''
	form.hudId = hudsData.value?.items?.[0]?.id ?? ''
	form.amount = hudsData.value?.items?.[0]?.price ?? 0
	isModalOpen.value = true
}
function onHudChange() {
	const hud = hudsData.value?.items?.find(h => h.id === form.hudId)
	if (hud) form.amount = hud.price
}
async function onSave() {
	if (!form.userId || !form.hudId) {
		toast.add({ title: 'User and HUD are required', color: 'error' })
		return
	}
	saving.value = true
	try {
		await $fetch('/api/admin/orders', { method: 'POST', body: { ...form } })
		toast.add({ title: 'Order recorded and license issued', color: 'success' })
		isModalOpen.value = false
		await refresh()
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Save failed', color: 'error' })
	} finally {
		saving.value = false
	}
}

async function onRefund(order: OrderRow) {
	if (!confirm(`Refund order for "${order.hudTitle}" ($${order.amount})? This revokes the license.`)) return
	try {
		await $fetch(`/api/admin/orders/${order.id}`, { method: 'PATCH', body: { status: 'refunded' } })
		toast.add({ title: 'Order refunded, license revoked', color: 'success' })
		await refresh()
		if (selected.value?.id === order.id) selected.value = data.value?.items.find(o => o.id === order.id) ?? null
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Refund failed', color: 'error' })
	}
}

async function extendLicense(order: OrderRow) {
	if (!order.license) return
	const base = order.license.expiresAt ? new Date(order.license.expiresAt) : new Date()
	base.setDate(base.getDate() + 30)
	try {
		await $fetch(`/api/admin/licenses/${order.license.id}`, { method: 'PATCH', body: { expiresAt: base.toISOString(), status: 'active' } })
		toast.add({ title: 'License extended 30 days', color: 'success' })
		await refresh()
		if (selected.value?.id === order.id) selected.value = data.value?.items.find(o => o.id === order.id) ?? null
	} catch {
		toast.add({ title: 'Action failed', color: 'error' })
	}
}

async function toggleRevoke(order: OrderRow) {
	if (!order.license) return
	const nextStatus = order.license.status === 'revoked' ? 'active' : 'revoked'
	try {
		await $fetch(`/api/admin/licenses/${order.license.id}`, { method: 'PATCH', body: { status: nextStatus } })
		toast.add({ title: nextStatus === 'revoked' ? 'License revoked' : 'License reactivated', color: 'success' })
		await refresh()
		if (selected.value?.id === order.id) selected.value = data.value?.items.find(o => o.id === order.id) ?? null
	} catch {
		toast.add({ title: 'Action failed', color: 'error' })
	}
}

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const orderStatusColor: Record<Order['status'], 'success' | 'error' | 'neutral'> = { paid: 'success', refunded: 'error', pending: 'neutral' }
const licenseStatusColor: Record<License['status'], 'success' | 'error' | 'warning'> = { active: 'success', revoked: 'error', expired: 'warning' }

const columns: TableColumn<OrderRow>[] = [
	{ id: 'orderId', header: 'Order ID', cell: ({ row }) => `#${row.original.id.slice(-6)}` },
	{ accessorKey: 'userName', header: 'User' },
	{ accessorKey: 'hudTitle', header: 'HUD' },
	{ accessorKey: 'amount', header: 'Price', cell: ({ row }) => `$${row.original.amount}` },
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => h(UBadge, { color: orderStatusColor[row.original.status], variant: 'subtle' }, () => row.original.status)
	},
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
			h(UButton, { size: 'xs', color: 'primary', variant: 'soft', onClick: () => selectOrder(row.original) }, () => 'View'),
			row.original.status === 'paid'
				? h(UButton, { size: 'xs', color: 'error', variant: 'soft', onClick: () => onRefund(row.original) }, () => 'Refund')
				: null
		])
	}
]

const stats = computed(() => {
	const items = data.value?.items ?? []
	return {
		total: items.length,
		revenue: items.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0),
		activeLicenses: items.filter(o => o.license?.status === 'active').length,
		refunded: items.filter(o => o.status === 'refunded').length
	}
})
</script>

<template>
	<div class="flex flex-col gap-6">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<h1 class="text-xl font-semibold">Orders <span class="text-muted font-normal">Management</span></h1>
			<div class="flex flex-wrap gap-2">
				<UInput v-model="search" icon="material-symbols:search" placeholder="Search orders..." />
				<USelect v-model="statusFilter" class="w-36" :items="[{ label: 'Status: All', value: 'all' }, { label: 'Paid', value: 'paid' }, { label: 'Pending', value: 'pending' }, { label: 'Refunded', value: 'refunded' }]" />
				<UButton icon="material-symbols:add" @click="openCreate">Add Manual Order</UButton>
			</div>
		</div>

		<UTable :data="filteredItems" :columns="columns" :loading="fetchStatus === 'pending'" />

		<UCard v-if="selected">
			<template #header>
				<div class="flex items-center justify-between">
					<p class="font-medium">Order #{{ selected.id.slice(-6) }} - {{ selected.hudTitle }}</p>
					<UButton size="xs" color="neutral" variant="ghost" icon="material-symbols:close" @click="selected = null" />
				</div>
			</template>

			<div class="flex gap-1 border-b border-default mb-4">
				<button
					v-for="tab in [['overview','Overview'],['license','License'],['actions','Actions']] as const" :key="tab[0]"
					class="px-3 py-2 text-sm border-b-2 -mb-px"
					:class="detailTab === tab[0] ? 'border-primary text-primary font-medium' : 'border-transparent text-muted'"
					@click="detailTab = tab[0]"
				>{{ tab[1] }}</button>
			</div>

			<div v-if="detailTab === 'overview'" class="flex flex-col gap-2 text-sm">
				<p><span class="text-muted">User:</span> {{ selected.userName }}</p>
				<p><span class="text-muted">HUD:</span> {{ selected.hudTitle }}</p>
				<p><span class="text-muted">Price:</span> ${{ selected.amount }}</p>
				<p><span class="text-muted">Order Date:</span> {{ new Date(selected.purchasedAt).toLocaleDateString() }}</p>
				<p><span class="text-muted">Status:</span> <UBadge :color="orderStatusColor[selected.status]" variant="subtle">{{ selected.status }}</UBadge></p>
			</div>

			<div v-else-if="detailTab === 'license'" class="flex flex-col gap-2 text-sm">
				<template v-if="selected.license">
					<p><span class="text-muted">Status:</span> <UBadge :color="licenseStatusColor[selected.license.status]" variant="subtle">{{ selected.license.status }}</UBadge></p>
					<p><span class="text-muted">Issued:</span> {{ new Date(selected.license.issuedAt).toLocaleDateString() }}</p>
					<p><span class="text-muted">Expires:</span> {{ selected.license.expiresAt ? new Date(selected.license.expiresAt).toLocaleDateString() : 'Never' }}</p>
				</template>
				<p v-else class="text-muted">No license on record.</p>
			</div>

			<div v-else class="flex gap-2 flex-wrap">
				<UButton v-if="selected.status === 'paid'" size="sm" color="error" variant="soft" @click="onRefund(selected)">Refund Order</UButton>
				<template v-if="selected.license">
					<UButton size="sm" color="neutral" variant="soft" @click="extendLicense(selected)">Extend License 30d</UButton>
					<UButton size="sm" :color="selected.license.status === 'revoked' ? 'success' : 'warning'" variant="soft" @click="toggleRevoke(selected)">
						{{ selected.license.status === 'revoked' ? 'Reactivate License' : 'Revoke License' }}
					</UButton>
				</template>
			</div>
		</UCard>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<AdminStatCard label="Total Orders" :value="stats.total" icon="material-symbols:receipt-long" color="blue" />
			<AdminStatCard label="Total Revenue" :value="`$${stats.revenue}`" icon="material-symbols:payments" color="green" />
			<AdminStatCard label="Active Licenses" :value="stats.activeLicenses" icon="material-symbols:verified-outline" color="purple" />
			<AdminStatCard label="Refunded" :value="stats.refunded" icon="material-symbols:currency-exchange" color="red" />
		</div>

		<UModal v-model:open="isModalOpen" title="Record Manual Order">
			<template #body>
				<form class="flex flex-col gap-4" @submit.prevent="onSave">
					<UFormField label="User">
						<USelect v-model="form.userId" class="w-full" :items="(usersData?.items ?? []).map(u => ({ label: `${u.name} (${u.email})`, value: u.id }))" />
					</UFormField>
					<UFormField label="HUD">
						<USelect v-model="form.hudId" class="w-full" :items="(hudsData?.items ?? []).map(h => ({ label: h.title, value: h.id }))" @update:model-value="onHudChange" />
					</UFormField>
					<UFormField label="Amount ($)">
						<UInput v-model.number="form.amount" type="number" class="w-full" />
					</UFormField>
					<div class="flex justify-end gap-2">
						<UButton color="neutral" variant="ghost" @click="isModalOpen = false">Cancel</UButton>
						<UButton type="submit" :loading="saving">Record</UButton>
					</div>
				</form>
			</template>
		</UModal>
	</div>
</template>
