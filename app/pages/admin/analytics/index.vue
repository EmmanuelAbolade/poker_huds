<!-- app/pages/admin/analytics/index.vue -->
<!-- Sales, popular HUDs, referral performance, user activity - the four
     things PROJECTDOC.md section 3.2 lists for Analytics. Charts are
     read-only aggregates computed by server/api/admin/analytics.get.ts;
     see AdminBarChart.vue's header comment for the charting approach. -->
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data, status } = await useFetch('/api/admin/analytics')

const userActivityTotal = computed(() => {
	const a = data.value?.userActivity
	return (a?.active ?? 0) + (a?.banned ?? 0)
})
const activePct = computed(() => userActivityTotal.value ? Math.round((data.value!.userActivity.active / userActivityTotal.value) * 100) : 0)
</script>

<template>
	<div class="flex flex-col gap-6">
		<div>
			<h1 class="text-xl font-semibold">Analytics</h1>
			<p class="text-sm text-muted">Computed from the mock store - the same shape a real database would feed once Phase 4 lands.</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<UCard>
				<template #header><p class="font-medium">Revenue by day</p></template>
				<AdminBarChart :items="data?.revenueByDay ?? []" value-prefix="$" />
			</UCard>

			<UCard>
				<template #header><p class="font-medium">Popular HUDs (by paid orders)</p></template>
				<AdminBarChart :items="data?.popularHuds ?? []" />
			</UCard>

			<UCard>
				<template #header><p class="font-medium">Referral earnings by referrer</p></template>
				<AdminBarChart :items="data?.referralEarnings ?? []" value-prefix="$" color="var(--ui-secondary, var(--ui-primary))" />
			</UCard>

			<UCard>
				<template #header><p class="font-medium">User activity</p></template>
				<div class="flex flex-col gap-3">
					<div class="flex h-3 rounded-full overflow-hidden gap-0.5" v-if="userActivityTotal">
						<div
							class="h-full rounded-full"
							:style="{ width: `${activePct}%`, background: 'var(--ui-success)' }"
							:title="`Active: ${data?.userActivity.active}`"
						/>
						<div
							class="h-full rounded-full flex-1"
							:style="{ background: 'var(--ui-error)' }"
							:title="`Banned: ${data?.userActivity.banned}`"
						/>
					</div>
					<p v-else class="text-sm text-muted">No users yet.</p>
					<div class="flex items-center gap-4 text-sm">
						<span class="flex items-center gap-1.5">
							<span class="size-2.5 rounded-full" style="background: var(--ui-success)" />
							Active ({{ data?.userActivity.active ?? 0 }})
						</span>
						<span class="flex items-center gap-1.5">
							<span class="size-2.5 rounded-full" style="background: var(--ui-error)" />
							Banned ({{ data?.userActivity.banned ?? 0 }})
						</span>
					</div>
				</div>
			</UCard>
		</div>

		<UAlert v-if="status === 'pending'" color="neutral" variant="soft" title="Loading..." />
	</div>
</template>
