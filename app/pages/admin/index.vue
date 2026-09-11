<!-- app/pages/admin/index.vue -->
<!-- Admin dashboard, redesigned to match the client's reference mockups
     (doc/IMG_2026090*.jpg): colorful gradient stat cards, a recent-
     orders feed, a referral tree sample, a HUD quick-manage panel, and
     a gradient area chart. Data from server/api/admin/stats.get.ts. -->
<script setup lang="ts">
import { verticalGradient, chartPalette } from '~/utils/chartColors'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data: stats } = await useFetch('/api/admin/stats')

const statusColor: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
	paid: 'success',
	pending: 'warning',
	refunded: 'error',
	published: 'success',
	draft: 'neutral'
}

const revenueChartData = computed(() => ({
	labels: stats.value?.revenueByDay?.map(d => d.day) ?? [],
	datasets: [{
		label: 'Revenue',
		data: stats.value?.revenueByDay?.map(d => d.amount) ?? [],
		borderColor: chartPalette.blue,
		fill: true,
		tension: 0.35,
		pointBackgroundColor: chartPalette.blue,
		pointRadius: 3,
		backgroundColor: (context: any) => {
			const { ctx, chartArea } = context.chart
			if (!chartArea) return undefined
			return verticalGradient(ctx, chartArea.top, chartArea.bottom, chartPalette.blue)
		}
	}]
}))

const { textColor, gridColor } = useChartTheme()
const revenueChartOptions = computed(() => ({
	plugins: { legend: { display: false } },
	scales: {
		x: { ticks: { color: textColor.value }, grid: { color: gridColor.value } },
		y: { beginAtZero: true, ticks: { color: textColor.value, callback: (v: string | number) => `$${v}` }, grid: { color: gridColor.value } }
	}
}))
</script>

<template>
	<div class="flex flex-col gap-6">
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<AdminStatCard label="Total Users" :value="stats?.totalUsers ?? 0" icon="material-symbols:group" color="blue" />
			<AdminStatCard label="Total HUDs" :value="stats?.totalHuds ?? 0" icon="material-symbols:widgets" color="green" />
			<AdminStatCard label="Total Orders" :value="stats?.totalOrders ?? 0" icon="material-symbols:receipt-long" color="purple" />
			<AdminStatCard label="Revenue Today" :value="`$${stats?.revenueToday ?? 0}`" icon="material-symbols:payments" color="orange" />
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<UCard class="min-w-0">
				<template #header>
					<div class="flex items-center justify-between">
						<p class="font-medium">Recent Orders</p>
						<UButton to="/admin/orders" size="xs" color="neutral" variant="ghost" trailing-icon="material-symbols:chevron-right">View All</UButton>
					</div>
				</template>
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-muted border-b border-default">
							<th class="pb-2 font-medium">User</th>
							<th class="pb-2 font-medium">HUD</th>
							<th class="pb-2 font-medium">Status</th>
							<th class="pb-2 font-medium text-right">Amount</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="order in stats?.recentOrders ?? []" :key="order.id" class="border-b border-default last:border-0">
							<td class="py-2">{{ order.userName }}</td>
							<td class="py-2 truncate max-w-32">{{ order.hudTitle }}</td>
							<td class="py-2"><UBadge :color="statusColor[order.status] ?? 'neutral'" variant="subtle">{{ order.status }}</UBadge></td>
							<td class="py-2 text-right font-medium">${{ order.amount }}</td>
						</tr>
						<tr v-if="!stats?.recentOrders?.length"><td colspan="4" class="py-4 text-center text-muted">No orders yet.</td></tr>
					</tbody>
				</table>
			</UCard>

			<UCard v-if="stats?.topReferrer" class="min-w-0">
				<template #header>
					<div class="flex items-center justify-between">
						<p class="font-medium">Referral Overview</p>
						<UButton to="/admin/referrals" size="xs" color="neutral" variant="ghost" trailing-icon="material-symbols:chevron-right">View Details</UButton>
					</div>
				</template>
				<div class="flex items-start justify-between gap-4">
					<div class="flex flex-col items-center gap-2 flex-1">
						<div class="rounded-md bg-elevated px-3 py-1.5 text-sm font-semibold">{{ stats.topReferrer.name }}</div>
						<div class="w-px h-4 bg-default" />
						<div class="flex gap-3 flex-wrap justify-center">
							<div v-for="name in stats.topReferrer.direct" :key="name" class="rounded-md border border-default px-2.5 py-1 text-xs">{{ name }}</div>
							<div v-for="name in stats.topReferrer.subReferrals" :key="name" class="rounded-md border border-dashed border-default px-2.5 py-1 text-xs text-muted">{{ name }}</div>
						</div>
					</div>
					<div class="flex flex-col gap-2 text-sm shrink-0">
						<p><span class="text-muted">Total Referrals</span> <span class="font-semibold">{{ stats.topReferrer.totalReferrals }}</span></p>
						<p><span class="text-muted">Total Earnings</span> <span class="font-semibold text-primary">${{ stats.topReferrer.totalEarnings }}</span></p>
					</div>
				</div>
			</UCard>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<UCard class="min-w-0">
				<template #header>
					<div class="flex items-center justify-between">
						<p class="font-medium">HUD Management</p>
						<UButton to="/admin/huds" size="xs" icon="material-symbols:add">Add New HUD</UButton>
					</div>
				</template>
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-muted border-b border-default">
							<th class="pb-2 font-medium">HUD Name</th>
							<th class="pb-2 font-medium">Category</th>
							<th class="pb-2 font-medium">Status</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="hud in stats?.hudsSample ?? []" :key="hud.id" class="border-b border-default last:border-0">
							<td class="py-2">
								<NuxtLink :to="`/admin/huds/${hud.id}`" class="hover:underline">{{ hud.title }}</NuxtLink>
							</td>
							<td class="py-2">{{ hud.categoryName }}</td>
							<td class="py-2"><UBadge :color="statusColor[hud.status] ?? 'neutral'" variant="subtle">{{ hud.status }}</UBadge></td>
						</tr>
					</tbody>
				</table>
			</UCard>

			<UCard class="min-w-0">
				<template #header><p class="font-medium">Sales &amp; Analytics</p></template>
				<div class="h-56">
					<AdminChartCanvas type="line" :data="revenueChartData" :options="revenueChartOptions" />
				</div>
			</UCard>
		</div>
	</div>
</template>
