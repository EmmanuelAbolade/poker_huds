<!-- app/pages/admin/index.vue -->
<!-- Admin dashboard: KPI cards fed by server/api/admin/stats.get.ts.
     Reference: PROJECTDOC.md section 3.2 "Dashboard" row. -->
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { data: stats } = await useFetch('/api/admin/stats')

const cards = computed(() => [
	{ label: 'Published HUDs', value: `${stats.value?.publishedHuds ?? 0} / ${stats.value?.totalHuds ?? 0}`, icon: 'material-symbols:widgets-outline' },
	{ label: 'Total Users', value: stats.value?.totalUsers ?? 0, icon: 'material-symbols:group-outline' },
	{ label: 'Revenue (paid orders)', value: `$${stats.value?.revenue ?? 0}`, icon: 'material-symbols:payments-outline' },
	{ label: 'Referrals (flagged)', value: `${stats.value?.totalReferrals ?? 0} (${stats.value?.flaggedReferrals ?? 0})`, icon: 'material-symbols:hub-outline' }
])
</script>

<template>
	<div class="flex flex-col gap-6">
		<div>
			<h1 class="text-xl font-semibold">Dashboard</h1>
			<p class="text-sm text-muted">System overview - data below is from the mock store (see PROJECTDOC.md section 5.4).</p>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<UCard v-for="card in cards" :key="card.label">
				<div class="flex items-center gap-3">
					<UIcon :name="card.icon" class="size-6 text-primary" />
					<div>
						<p class="text-xs text-muted">{{ card.label }}</p>
						<p class="text-lg font-semibold">{{ card.value }}</p>
					</div>
				</div>
			</UCard>
		</div>

		<UAlert
			color="neutral"
			variant="soft"
			title="Phase 0 scaffold"
			description="Categories has full CRUD wired up as the reference module. Other modules in the sidebar are placeholders pending Phase 1-3 - see PROJECTDOC.md section 8 (Roadmap)."
		/>
	</div>
</template>
