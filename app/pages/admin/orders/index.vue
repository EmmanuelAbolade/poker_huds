<!-- app/pages/admin/orders/index.vue -->
<!-- Orders & Licenses. Orders aren't hard-deletable here (financial
     records shouldn't disappear) - "manage" means refund (which cascades
     to revoking the license) and directly extending/revoking a license.
     A manual "Record Order" create exists for comp/support-granted
     purchases; normal orders will come from the storefront checkout
     (Phase 5) into this same collection. -->
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
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Refund failed', color: 'error' })
	}
}

async function extendLicense(order: OrderRow) {
	if (!order.license) return
	const base = order.license.expiresAt ? new Date(order.license.expiresAt) : new Date()
	base.setDate(base.getDate() + 30)
	try {
		await $fetch(`/api/admin/licenses/${order.license.id}`, {
			method: 'PATCH',
			body: { expiresAt: base.toISOString(), status: 'active' }
		})
		toast.add({ title: 'License extended 30 days', color: 'success' })
		await refresh()
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
	} catch {
		toast.add({ title: 'Action failed', color: 'error' })
	}
}

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const orderStatusColor: Record<Order['status'], 'success' | 'error' | 'neutral'> = {
	paid: 'success',
	refunded: 'error',
	pending: 'neutral'
}
const licenseStatusColor: Record<License['status'], 'success' | 'error' | 'warning'> = {
	active: 'success',
	revoked: 'error',
	expired: 'warning'
}

const columns: TableColumn<OrderRow>[] = [
	{ accessorKey: 'userName', header: 'User' },
	{ accessorKey: 'hudTitle', header: 'HUD' },
	{ accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `$${row.original.amount}` },
	{
		id: 'orderStatus',
		header: 'Order',
		cell: ({ row }) => h(UBadge, { color: orderStatusColor[row.original.status], variant: 'subtle' }, () => row.original.status)
	},
	{
		id: 'licenseStatus',
		header: 'License',
		cell: ({ row }) => row.original.license
			? h(UBadge, { color: licenseStatusColor[row.original.license.status], variant: 'subtle' }, () => row.original.license!.status)
			: '—'
	},
	{
		id: 'expiresAt',
		header: 'Expires',
		cell: ({ row }) => row.original.license?.expiresAt
			? new Date(row.original.license.expiresAt).toLocaleDateString()
			: (row.original.license ? 'Never' : '—')
	},
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => h('div', { class: 'flex gap-2 flex-wrap' }, [
			row.original.status === 'paid'
				? h(UButton, { size: 'xs', color: 'error', variant: 'soft', onClick: () => onRefund(row.original) }, () => 'Refund')
				: null,
			row.original.license
				? h(UButton, { size: 'xs', color: 'neutral', variant: 'soft', onClick: () => extendLicense(row.original) }, () => 'Extend 30d')
				: null,
			row.original.license
				? h(UButton, {
					size: 'xs',
					color: row.original.license.status === 'revoked' ? 'success' : 'warning',
					variant: 'soft',
					onClick: () => toggleRevoke(row.original)
				}, () => row.original.license!.status === 'revoked' ? 'Reactivate' : 'Revoke')
				: null
		])
	}
]
</script>

<template>
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-xl font-semibold">Orders &amp; Licenses</h1>
				<p class="text-sm text-muted">Refunding an order revokes its license. Orders aren't deletable - refund instead, to keep the record.</p>
			</div>
			<UButton icon="material-symbols:add" @click="openCreate">Record Order</UButton>
		</div>

		<UTable :data="data?.items ?? []" :columns="columns" :loading="fetchStatus === 'pending'" />

		<UModal v-model:open="isModalOpen" title="Record Manual Order">
			<template #body>
				<form class="flex flex-col gap-4" @submit.prevent="onSave">
					<UFormField label="User">
						<USelect
							v-model="form.userId"
							class="w-full"
							:items="(usersData?.items ?? []).map(u => ({ label: `${u.name} (${u.email})`, value: u.id }))"
						/>
					</UFormField>
					<UFormField label="HUD">
						<USelect
							v-model="form.hudId"
							class="w-full"
							:items="(hudsData?.items ?? []).map(h => ({ label: h.title, value: h.id }))"
							@update:model-value="onHudChange"
						/>
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
