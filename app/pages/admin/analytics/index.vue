<!-- app/pages/admin/analytics/index.vue -->
<!-- Analytics, redesigned to match the client's reference mockups (doc/
     IMG_2026090*.jpg): colorful KPI row, a 3-column chart row (revenue
     line, orders breakdown bar, license activity donut), a real Key
     Metrics table, a recent-activity feed, and a bottom stat row. Data
     from server/api/admin/analytics.get.ts - see that route's header
     comment for why some reference metrics (conversion rate, payment-
     gateway success rate) are intentionally absent rather than faked. -->
<script setup lang="ts">
import { chartPalette, verticalGradient } from '~/utils/chartColors'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data } = await useFetch('/api/admin/analytics')
const { textColor, gridColor } = useChartTheme()

const activityIcon: Record<string, string> = {
	order: 'material-symbols:shopping-cart-outline',
	refund: 'material-symbols:currency-exchange',
	referral: 'material-symbols:hub-outline'
}

const revenueData = computed(() => ({
	labels: data.value?.revenueByDay?.map(d => d.day) ?? [],
	datasets: [{
		label: 'Revenue',
		data: data.value?.revenueByDay?.map(d => d.amount) ?? [],
		borderColor: chartPalette.blue,
		fill: true,
		tension: 0.35,
		pointBackgroundColor: chartPalette.blue,
		pointRadius: 3,
		backgroundColor: (context: any) => {
			const { ctx, chartArea } = context.chart
			return chartArea ? verticalGradient(ctx, chartArea.top, chartArea.bottom, chartPalette.blue) : undefined
		}
	}]
}))
const revenueOptions = computed(() => ({
	plugins: { legend: { display: false } },
	scales: {
		x: { ticks: { color: textColor.value }, grid: { display: false } },
		y: { beginAtZero: true, ticks: { color: textColor.value, callback: (v: string | number) => `$${v}` }, grid: { color: gridColor.value } }
	}
}))

const ordersBreakdownData = computed(() => ({
	labels: ['Paid', 'Pending', 'Refunded'],
	datasets: [{
		data: [data.value?.ordersBreakdown.paid ?? 0, data.value?.ordersBreakdown.pending ?? 0, data.value?.ordersBreakdown.refunded ?? 0],
		backgroundColor: [chartPalette.blue, chartPalette.green, chartPalette.gray],
		borderRadius: 6,
		maxBarThickness: 48
	}]
}))
const ordersBreakdownOptions = computed(() => ({
	plugins: { legend: { display: false } },
	scales: {
		x: { ticks: { color: textColor.value }, grid: { display: false } },
		y: { beginAtZero: true, ticks: { color: textColor.value, precision: 0 }, grid: { color: gridColor.value } }
	}
}))

const licenseActivityData = computed(() => ({
	labels: ['Active', 'Expired', 'Revoked'],
	datasets: [{
		data: [data.value?.licenseActivity.active ?? 0, data.value?.licenseActivity.expired ?? 0, data.value?.licenseActivity.revoked ?? 0],
		backgroundColor: [chartPalette.blue, chartPalette.amber, chartPalette.gray],
		borderWidth: 0
	}]
}))
const licenseActivityOptions = computed(() => ({
	cutout: '65%',
	plugins: { legend: { position: 'bottom' as const, labels: { color: textColor.value, boxWidth: 10, padding: 12 } } }
}))
</script>

<template>
	<div class="flex flex-col gap-6">
		<div>
			<h1 class="text-xl font-semibold">Analytics</h1>
			<p class="text-sm text-muted">Computed from the real database.</p>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<AdminStatCard label="Total Revenue" :value="`$${data?.kpis.totalRevenue ?? 0}`" :change="data?.kpis.totalRevenueChange ?? undefined" icon="material-symbols:payments" color="green" />
			<AdminStatCard label="Active Licenses" :value="data?.kpis.activeLicenses ?? 0" icon="material-symbols:verified-outline" color="blue" />
			<AdminStatCard label="New Orders (30d)" :value="data?.kpis.newOrders ?? 0" :change="data?.kpis.newOrdersChange ?? undefined" icon="material-symbols:shopping-cart" color="purple" />
			<AdminStatCard label="Pending Payments" :value="data?.kpis.pendingPayments ?? 0" icon="material-symbols:hourglass-empty" color="orange" />
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
			<UCard class="min-w-0">
				<template #header><p class="font-medium">Revenue Trends</p></template>
				<div class="h-52"><AdminChartCanvas type="line" :data="revenueData" :options="revenueOptions" /></div>
			</UCard>
			<UCard class="min-w-0">
				<template #header><p class="font-medium">Orders Breakdown</p></template>
				<div class="h-52"><AdminChartCanvas type="bar" :data="ordersBreakdownData" :options="ordersBreakdownOptions" /></div>
			</UCard>
			<UCard class="min-w-0">
				<template #header><p class="font-medium">License Activity</p></template>
				<div class="h-52"><AdminChartCanvas type="doughnut" :data="licenseActivityData" :options="licenseActivityOptions" /></div>
			</UCard>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<UCard class="min-w-0">
				<template #header><p class="font-medium">Key Metrics</p></template>
				<table class="w-full text-sm">
					<tbody>
						<tr class="border-b border-default">
							<td class="py-2 text-muted">Average Order Value</td>
							<td class="py-2 text-right font-semibold">${{ data?.keyMetrics.averageOrderValue ?? 0 }}</td>
						</tr>
						<tr class="border-b border-default">
							<td class="py-2 text-muted">Refund Rate</td>
							<td class="py-2 text-right font-semibold">{{ data?.keyMetrics.refundRate ?? 0 }}%</td>
						</tr>
						<tr class="border-b border-default">
							<td class="py-2 text-muted">Total Paid Orders</td>
							<td class="py-2 text-right font-semibold">{{ data?.keyMetrics.totalPaidOrders ?? 0 }}</td>
						</tr>
						<tr>
							<td class="py-2 text-muted">Active License Rate</td>
							<td class="py-2 text-right font-semibold">{{ data?.keyMetrics.activeLicenseRate ?? 0 }}%</td>
						</tr>
					</tbody>
				</table>
			</UCard>

			<UCard class="min-w-0">
				<template #header><p class="font-medium">Recent Activity</p></template>
				<ul class="flex flex-col gap-3">
					<li v-for="(item, i) in data?.recentActivity ?? []" :key="i" class="flex items-start gap-3">
						<UIcon :name="activityIcon[item.type] ?? 'material-symbols:circle'" class="size-5 text-primary mt-0.5 shrink-0" />
						<div class="min-w-0">
							<p class="text-sm font-medium">{{ item.title }}</p>
							<p class="text-xs text-muted truncate">{{ item.subtitle }}</p>
						</div>
						<span class="text-xs text-muted ml-auto shrink-0">{{ new Date(item.date).toLocaleDateString() }}</span>
					</li>
					<li v-if="!data?.recentActivity?.length" class="text-sm text-muted">No activity yet.</li>
				</ul>
			</UCard>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<AdminStatCard label="Total Users" :value="data?.totals.totalUsers ?? 0" icon="material-symbols:group" color="blue" />
			<AdminStatCard label="Total HUDs Sold" :value="data?.totals.totalHudsSold ?? 0" icon="material-symbols:sell-outline" color="green" />
			<AdminStatCard label="Total Referrals" :value="data?.totals.totalReferrals ?? 0" icon="material-symbols:hub-outline" color="purple" />
			<AdminStatCard label="Flagged Referrals" :value="data?.totals.flaggedReferrals ?? 0" icon="material-symbols:flag-outline" color="red" />
		</div>
	</div>
</template>
