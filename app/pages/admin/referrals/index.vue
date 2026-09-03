<!-- app/pages/admin/referrals/index.vue -->
<!-- Referrals - the module the client specifically called out ("monitor
     referrals and manage them if he needs to"). Two levels are already
     baked into the data model (level 1 = direct, level 2 = sub-referral,
     both attributed to referrerUserId - see prisma/seed.ts seed
     data). This page has a read-only tree summary grouped by top
     referrer (the "visualization" the client's doc asks for) plus a flat
     records table with the actual admin controls: adjust earnings,
     flag/unflag suspected abuse, delete a bad entry, export to CSV. -->
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Customer } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type ReferralRow = {
	id: string
	referrerUserId: string
	referredUserId: string
	referrerName: string
	referredName: string
	level: 1 | 2
	earnings: number
	flagged: boolean
	createdAt: string
}

const toast = useToast()
const { data, refresh, status: fetchStatus } = await useFetch<{ items: ReferralRow[] }>('/api/admin/referrals')
const { data: usersData } = await useFetch<{ items: Customer[] }>('/api/admin/users')

const tree = computed(() => {
	const groups = new Map<string, { referrerName: string, direct: ReferralRow[], sub: ReferralRow[], totalEarnings: number, flaggedCount: number }>()
	for (const r of data.value?.items ?? []) {
		if (!groups.has(r.referrerUserId)) {
			groups.set(r.referrerUserId, { referrerName: r.referrerName, direct: [], sub: [], totalEarnings: 0, flaggedCount: 0 })
		}
		const group = groups.get(r.referrerUserId)!
		if (r.level === 1) group.direct.push(r)
		else group.sub.push(r)
		group.totalEarnings += r.earnings
		if (r.flagged) group.flaggedCount += 1
	}
	return [...groups.values()]
})

const isCreateOpen = ref(false)
const createForm = reactive({ referrerUserId: '', referredUserId: '', level: 1 as 1 | 2, earnings: 0 })
const isEarningsOpen = ref(false)
const editingReferral = ref<ReferralRow | null>(null)
const earningsForm = reactive({ earnings: 0 })
const saving = ref(false)

function openCreate() {
	createForm.referrerUserId = usersData.value?.items?.[0]?.id ?? ''
	createForm.referredUserId = usersData.value?.items?.[1]?.id ?? ''
	createForm.level = 1
	createForm.earnings = 0
	isCreateOpen.value = true
}

async function onCreate() {
	if (!createForm.referrerUserId || !createForm.referredUserId) {
		toast.add({ title: 'Referrer and referred user are required', color: 'error' })
		return
	}
	saving.value = true
	try {
		await $fetch('/api/admin/referrals', { method: 'POST', body: { ...createForm } })
		toast.add({ title: 'Referral recorded', color: 'success' })
		isCreateOpen.value = false
		await refresh()
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Save failed', color: 'error' })
	} finally {
		saving.value = false
	}
}

function openEarnings(referral: ReferralRow) {
	editingReferral.value = referral
	earningsForm.earnings = referral.earnings
	isEarningsOpen.value = true
}

async function onSaveEarnings() {
	if (!editingReferral.value) return
	saving.value = true
	try {
		await $fetch(`/api/admin/referrals/${editingReferral.value.id}`, { method: 'PATCH', body: { earnings: earningsForm.earnings } })
		toast.add({ title: 'Earnings updated', color: 'success' })
		isEarningsOpen.value = false
		await refresh()
	} catch {
		toast.add({ title: 'Save failed', color: 'error' })
	} finally {
		saving.value = false
	}
}

async function toggleFlag(referral: ReferralRow) {
	try {
		await $fetch(`/api/admin/referrals/${referral.id}`, { method: 'PATCH', body: { flagged: !referral.flagged } })
		toast.add({ title: referral.flagged ? 'Referral unflagged' : 'Referral flagged for review', color: 'success' })
		await refresh()
	} catch {
		toast.add({ title: 'Action failed', color: 'error' })
	}
}

async function onDelete(referral: ReferralRow) {
	if (!confirm(`Delete the referral from ${referral.referrerName} to ${referral.referredName}?`)) return
	try {
		await $fetch(`/api/admin/referrals/${referral.id}`, { method: 'DELETE' })
		toast.add({ title: 'Referral deleted', color: 'success' })
		await refresh()
	} catch {
		toast.add({ title: 'Delete failed', color: 'error' })
	}
}

function exportCsv() {
	const rows = data.value?.items ?? []
	const header = ['Referrer', 'Referred', 'Level', 'Earnings', 'Flagged', 'Created At']
	const lines = rows.map(r => [r.referrerName, r.referredName, r.level, r.earnings, r.flagged, r.createdAt].join(','))
	const csv = [header.join(','), ...lines].join('\n')
	const blob = new Blob([csv], { type: 'text/csv' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = 'referrals.csv'
	a.click()
	URL.revokeObjectURL(url)
}

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<ReferralRow>[] = [
	{ accessorKey: 'referrerName', header: 'Referrer' },
	{ accessorKey: 'referredName', header: 'Referred' },
	{
		accessorKey: 'level',
		header: 'Level',
		cell: ({ row }) => h(UBadge, { color: 'neutral', variant: 'subtle' }, () => row.original.level === 1 ? 'Direct' : 'Sub-referral')
	},
	{ accessorKey: 'earnings', header: 'Earnings', cell: ({ row }) => `$${row.original.earnings}` },
	{
		accessorKey: 'flagged',
		header: 'Status',
		cell: ({ row }) => row.original.flagged
			? h(UBadge, { color: 'error', variant: 'subtle' }, () => 'Flagged')
			: h(UBadge, { color: 'success', variant: 'subtle' }, () => 'OK')
	},
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => h('div', { class: 'flex gap-2 flex-wrap' }, [
			h(UButton, { size: 'xs', color: 'neutral', variant: 'soft', onClick: () => openEarnings(row.original) }, () => 'Adjust Earnings'),
			h(UButton, {
				size: 'xs',
				color: row.original.flagged ? 'success' : 'warning',
				variant: 'soft',
				onClick: () => toggleFlag(row.original)
			}, () => row.original.flagged ? 'Unflag' : 'Flag Abuse'),
			h(UButton, { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDelete(row.original) }, () => 'Delete')
		])
	}
]
</script>

<template>
	<div class="flex flex-col gap-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-xl font-semibold">Referrals</h1>
				<p class="text-sm text-muted">Direct referrals + sub-referrals, earnings, and abuse flagging.</p>
			</div>
			<div class="flex gap-2">
				<UButton color="neutral" variant="soft" icon="material-symbols:download" @click="exportCsv">Export CSV</UButton>
				<UButton icon="material-symbols:add" @click="openCreate">New Referral</UButton>
			</div>
		</div>

		<div>
			<p class="font-medium mb-2">Referral Tree</p>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<UCard v-for="group in tree" :key="group.referrerName">
					<template #header>
						<div class="flex items-center justify-between">
							<p class="font-medium">{{ group.referrerName }}</p>
							<div class="flex items-center gap-2">
								<UBadge v-if="group.flaggedCount" color="error" variant="subtle">{{ group.flaggedCount }} flagged</UBadge>
								<UBadge color="success" variant="subtle">${{ group.totalEarnings }} earned</UBadge>
							</div>
						</div>
					</template>
					<div class="flex flex-col gap-2 text-sm">
						<div v-for="r in group.direct" :key="r.id" class="flex justify-between">
							<span>→ {{ r.referredName }} <span class="text-muted">(direct)</span></span>
							<span>${{ r.earnings }}</span>
						</div>
						<div v-for="r in group.sub" :key="r.id" class="flex justify-between pl-4">
							<span>↳ {{ r.referredName }} <span class="text-muted">(sub-referral)</span></span>
							<span>${{ r.earnings }}</span>
						</div>
					</div>
				</UCard>
			</div>
			<UAlert v-if="!tree.length" class="mt-2" color="neutral" variant="soft" title="No referrals yet" />
		</div>

		<div>
			<p class="font-medium mb-2">Referral Records</p>
			<UTable :data="data?.items ?? []" :columns="columns" :loading="fetchStatus === 'pending'" />
		</div>

		<UModal v-model:open="isCreateOpen" title="New Referral">
			<template #body>
				<form class="flex flex-col gap-4" @submit.prevent="onCreate">
					<UFormField label="Referrer (gets credit)">
						<USelect
							v-model="createForm.referrerUserId"
							class="w-full"
							:items="(usersData?.items ?? []).map(u => ({ label: u.name, value: u.id }))"
						/>
					</UFormField>
					<UFormField label="Referred user">
						<USelect
							v-model="createForm.referredUserId"
							class="w-full"
							:items="(usersData?.items ?? []).map(u => ({ label: u.name, value: u.id }))"
						/>
					</UFormField>
					<UFormField label="Level">
						<USelect
							v-model="createForm.level"
							class="w-full"
							:items="[{ label: 'Direct', value: 1 }, { label: 'Sub-referral', value: 2 }]"
						/>
					</UFormField>
					<UFormField label="Earnings ($)">
						<UInput v-model.number="createForm.earnings" type="number" class="w-full" />
					</UFormField>
					<div class="flex justify-end gap-2">
						<UButton color="neutral" variant="ghost" @click="isCreateOpen = false">Cancel</UButton>
						<UButton type="submit" :loading="saving">Save</UButton>
					</div>
				</form>
			</template>
		</UModal>

		<UModal v-model:open="isEarningsOpen" title="Adjust Earnings">
			<template #body>
				<form class="flex flex-col gap-4" @submit.prevent="onSaveEarnings">
					<UFormField label="Earnings ($)">
						<UInput v-model.number="earningsForm.earnings" type="number" class="w-full" />
					</UFormField>
					<div class="flex justify-end gap-2">
						<UButton color="neutral" variant="ghost" @click="isEarningsOpen = false">Cancel</UButton>
						<UButton type="submit" :loading="saving">Save</UButton>
					</div>
				</form>
			</template>
		</UModal>
	</div>
</template>
