<!-- app/pages/admin/referrals/index.vue -->
<!-- Referrals - redesigned to match the client's reference mockup (doc/
     IMG_20260907_165635.jpg): the reference groups rows by REFERRER
     (aggregated direct/sub counts + total earnings + a single status),
     not by individual referral edge like the earlier version of this
     page did - grouping computed client-side from the existing flat
     /api/admin/referrals list, no new backend endpoint needed given how
     small this dataset is. "Suspend"/"Activate" flags every one of that
     referrer's individual referral records at once (a real, if bulk,
     use of the existing per-record flag endpoint) - the client's spec
     doesn't define a separate "referrer account status," so this is the
     closest honest mapping of the reference's status column onto data
     that actually exists. The per-edge records (adjust earnings,
     delete) stay real functionality, now inside the Earnings tab. -->
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Customer } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type ReferralRow = {
	id: string, referrerUserId: string, referredUserId: string,
	referrerName: string, referredName: string, level: 1 | 2, earnings: number, flagged: boolean, createdAt: string
}
type ReferrerGroup = {
	referrerUserId: string, referrerName: string, referrerEmail: string
	direct: ReferralRow[], sub: ReferralRow[], totalEarnings: number, suspended: boolean
}

const toast = useToast()
const { data, refresh, status: fetchStatus } = await useFetch<{ items: ReferralRow[] }>('/api/admin/referrals')
const { data: usersData } = await useFetch<{ items: Customer[] }>('/api/admin/users')

function emailFor(userId: string) {
	return usersData.value?.items?.find(u => u.id === userId)?.email ?? '—'
}

const groups = computed<ReferrerGroup[]>(() => {
	const map = new Map<string, ReferrerGroup>()
	for (const r of data.value?.items ?? []) {
		if (!map.has(r.referrerUserId)) {
			map.set(r.referrerUserId, {
				referrerUserId: r.referrerUserId, referrerName: r.referrerName, referrerEmail: emailFor(r.referrerUserId),
				direct: [], sub: [], totalEarnings: 0, suspended: false
			})
		}
		const group = map.get(r.referrerUserId)!
		if (r.level === 1) group.direct.push(r); else group.sub.push(r)
		group.totalEarnings += r.earnings
		if (r.flagged) group.suspended = true
	}
	return [...map.values()]
})

const search = ref('')
const statusFilter = ref<'all' | 'active' | 'suspended'>('all')
const filteredGroups = computed(() => groups.value.filter((g) => {
	const matchesSearch = !search.value || g.referrerName.toLowerCase().includes(search.value.toLowerCase())
	const matchesStatus = statusFilter.value === 'all' || (statusFilter.value === 'suspended') === g.suspended
	return matchesSearch && matchesStatus
}))

const selected = ref<ReferrerGroup | null>(null)
const detailTab = ref<'overview' | 'tree' | 'earnings'>('overview')
function selectGroup(group: ReferrerGroup) {
	selected.value = group
	detailTab.value = 'overview'
}

async function toggleSuspend(group: ReferrerGroup) {
	const nextFlagged = !group.suspended
	try {
		await Promise.all([...group.direct, ...group.sub].map(r =>
			$fetch(`/api/admin/referrals/${r.id}`, { method: 'PATCH', body: { flagged: nextFlagged } })
		))
		toast.add({ title: nextFlagged ? 'Referrer suspended' : 'Referrer activated', color: 'success' })
		await refresh()
		if (selected.value?.referrerUserId === group.referrerUserId) {
			selected.value = groups.value.find(g => g.referrerUserId === group.referrerUserId) ?? null
		}
	} catch {
		toast.add({ title: 'Action failed', color: 'error' })
	}
}

// --- manual referral create ---
const isCreateOpen = ref(false)
const createForm = reactive({ referrerUserId: '', referredUserId: '', level: 1 as 1 | 2, earnings: 0 })
const saving = ref(false)
function openCreate() {
	createForm.referrerUserId = usersData.value?.items?.[0]?.id ?? ''
	createForm.referredUserId = usersData.value?.items?.[1]?.id ?? ''
	createForm.level = 1
	createForm.earnings = 0
	isCreateOpen.value = true
}
async function onCreate() {
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

// --- earnings adjustment (per edge, in the Earnings tab) ---
const isEarningsOpen = ref(false)
const editingReferral = ref<ReferralRow | null>(null)
const earningsForm = reactive({ earnings: 0 })
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
		if (selected.value) selected.value = groups.value.find(g => g.referrerUserId === selected.value!.referrerUserId) ?? null
	} catch {
		toast.add({ title: 'Save failed', color: 'error' })
	} finally {
		saving.value = false
	}
}
async function onDeleteEdge(referral: ReferralRow) {
	if (!confirm(`Delete the referral from ${referral.referrerName} to ${referral.referredName}?`)) return
	try {
		await $fetch(`/api/admin/referrals/${referral.id}`, { method: 'DELETE' })
		toast.add({ title: 'Referral deleted', color: 'success' })
		await refresh()
		if (selected.value) selected.value = groups.value.find(g => g.referrerUserId === selected.value!.referrerUserId) ?? null
	} catch {
		toast.add({ title: 'Delete failed', color: 'error' })
	}
}

function exportCsv() {
	const rows = data.value?.items ?? []
	const header = ['Referrer', 'Referred', 'Level', 'Earnings', 'Flagged', 'Created At']
	const lines = rows.map(r => [r.referrerName, r.referredName, r.level, r.earnings, r.flagged, r.createdAt].join(','))
	const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = 'referrals.csv'
	a.click()
	URL.revokeObjectURL(url)
}

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<ReferrerGroup>[] = [
	{ accessorKey: 'referrerName', header: 'Referrer' },
	{ accessorKey: 'referrerEmail', header: 'Email' },
	{ id: 'direct', header: 'Direct Referrals', cell: ({ row }) => row.original.direct.length },
	{ id: 'sub', header: 'Sub-Referrals', cell: ({ row }) => row.original.sub.length },
	{ id: 'earnings', header: 'Earnings', cell: ({ row }) => `$${row.original.totalEarnings}` },
	{
		id: 'status',
		header: 'Status',
		cell: ({ row }) => h(UBadge, { color: row.original.suspended ? 'error' : 'success', variant: 'subtle' }, () => row.original.suspended ? 'suspended' : 'active')
	},
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) => h('div', { class: 'flex gap-2' }, [
			h(UButton, { size: 'xs', color: 'primary', variant: 'soft', onClick: () => selectGroup(row.original) }, () => 'View'),
			h(UButton, { size: 'xs', color: row.original.suspended ? 'success' : 'error', variant: 'soft', onClick: () => toggleSuspend(row.original) }, () => row.original.suspended ? 'Activate' : 'Suspend')
		])
	}
]

const stats = computed(() => ({
	totalReferrers: groups.value.length,
	totalEarnings: groups.value.reduce((sum, g) => sum + g.totalEarnings, 0),
	active: groups.value.filter(g => !g.suspended).length,
	suspended: groups.value.filter(g => g.suspended).length
}))
</script>

<template>
	<div class="flex flex-col gap-6">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<h1 class="text-xl font-semibold">Referrals <span class="text-muted font-normal">Management</span></h1>
			<div class="flex flex-wrap gap-2">
				<UInput v-model="search" icon="material-symbols:search" placeholder="Search referrals..." />
				<USelect v-model="statusFilter" class="w-36" :items="[{ label: 'Status: All', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Suspended', value: 'suspended' }]" />
				<UButton color="neutral" variant="soft" icon="material-symbols:download" @click="exportCsv">Export CSV</UButton>
				<UButton icon="material-symbols:add" @click="openCreate">Add Manual Referral</UButton>
			</div>
		</div>

		<UTable :data="filteredGroups" :columns="columns" :loading="fetchStatus === 'pending'" />

		<UCard v-if="selected">
			<template #header>
				<div class="flex items-center justify-between">
					<p class="font-medium">Referrer: {{ selected.referrerName }}</p>
					<UButton size="xs" color="neutral" variant="ghost" icon="material-symbols:close" @click="selected = null" />
				</div>
			</template>

			<div class="flex gap-1 border-b border-default mb-4">
				<button
					v-for="tab in [['overview','Overview'],['tree','Tree'],['earnings','Earnings']] as const" :key="tab[0]"
					class="px-3 py-2 text-sm border-b-2 -mb-px"
					:class="detailTab === tab[0] ? 'border-primary text-primary font-medium' : 'border-transparent text-muted'"
					@click="detailTab = tab[0]"
				>{{ tab[1] }}</button>
			</div>

			<div v-if="detailTab === 'overview'" class="flex flex-col gap-2 text-sm">
				<p><span class="text-muted">Name:</span> {{ selected.referrerName }}</p>
				<p><span class="text-muted">Email:</span> {{ selected.referrerEmail }}</p>
				<p><span class="text-muted">Status:</span> <UBadge :color="selected.suspended ? 'error' : 'success'" variant="subtle">{{ selected.suspended ? 'suspended' : 'active' }}</UBadge></p>
				<p><span class="text-muted">Total Direct Referrals:</span> {{ selected.direct.length }}</p>
				<p><span class="text-muted">Total Sub-Referrals:</span> {{ selected.sub.length }}</p>
				<p><span class="text-muted">Total Earnings:</span> <span class="text-primary font-semibold">${{ selected.totalEarnings }}</span></p>
			</div>

			<div v-else-if="detailTab === 'tree'" class="flex flex-col items-center gap-2">
				<div class="rounded-md bg-elevated px-3 py-1.5 text-sm font-semibold">{{ selected.referrerName }}</div>
				<div class="w-px h-4 bg-default" />
				<div class="flex gap-3 flex-wrap justify-center">
					<div v-for="r in selected.direct" :key="r.id" class="rounded-md border border-default px-2.5 py-1 text-xs">{{ r.referredName }} <span class="text-muted">(${{ r.earnings }})</span></div>
					<div v-for="r in selected.sub" :key="r.id" class="rounded-md border border-dashed border-default px-2.5 py-1 text-xs text-muted">{{ r.referredName }} <span>(${{ r.earnings }})</span></div>
				</div>
				<p v-if="!selected.direct.length && !selected.sub.length" class="text-sm text-muted">No referrals yet.</p>
			</div>

			<table v-else class="w-full text-sm">
				<thead>
					<tr class="text-left text-muted border-b border-default">
						<th class="pb-2 font-medium">Referred</th>
						<th class="pb-2 font-medium">Level</th>
						<th class="pb-2 font-medium">Earnings</th>
						<th class="pb-2 font-medium">Actions</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="r in [...selected.direct, ...selected.sub]" :key="r.id" class="border-b border-default last:border-0">
						<td class="py-2">{{ r.referredName }}</td>
						<td class="py-2">{{ r.level === 1 ? 'Direct' : 'Sub-referral' }}</td>
						<td class="py-2">${{ r.earnings }}</td>
						<td class="py-2 flex gap-2">
							<UButton size="xs" color="neutral" variant="soft" @click="openEarnings(r)">Adjust</UButton>
							<UButton size="xs" color="error" variant="soft" @click="onDeleteEdge(r)">Delete</UButton>
						</td>
					</tr>
				</tbody>
			</table>
		</UCard>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<AdminStatCard label="Total Referrers" :value="stats.totalReferrers" icon="material-symbols:group-outline" color="blue" />
			<AdminStatCard label="Total Referral Earnings" :value="`$${stats.totalEarnings}`" icon="material-symbols:payments" color="green" />
			<AdminStatCard label="Active Referrers" :value="stats.active" icon="material-symbols:check-circle-outline" color="orange" />
			<AdminStatCard label="Suspended Referrers" :value="stats.suspended" icon="material-symbols:block" color="red" />
		</div>

		<UModal v-model:open="isCreateOpen" title="New Referral">
			<template #body>
				<form class="flex flex-col gap-4" @submit.prevent="onCreate">
					<UFormField label="Referrer (gets credit)">
						<USelect v-model="createForm.referrerUserId" class="w-full" :items="(usersData?.items ?? []).map(u => ({ label: u.name, value: u.id }))" />
					</UFormField>
					<UFormField label="Referred user">
						<USelect v-model="createForm.referredUserId" class="w-full" :items="(usersData?.items ?? []).map(u => ({ label: u.name, value: u.id }))" />
					</UFormField>
					<UFormField label="Level">
						<USelect v-model="createForm.level" class="w-full" :items="[{ label: 'Direct', value: 1 }, { label: 'Sub-referral', value: 2 }]" />
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
