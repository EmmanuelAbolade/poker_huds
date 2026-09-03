<!-- app/components/admin/AdminComingSoon.vue -->
<!-- Shared placeholder shown on admin modules not yet built. Keeps the
     sidebar nav fully clickable today (see DIARY.md Day 1) while making
     it obvious what's scaffolded vs. what's pending, and which roadmap
     phase (PROJECTDOC.md section 8) it lands in. -->
<script setup lang="ts">
defineProps<{
	title: string
	description: string
	phase: string
}>()
</script>

<template>
	<div class="flex flex-col gap-4">
		<div>
			<h1 class="text-xl font-semibold">{{ title }}</h1>
			<p class="text-sm text-muted">{{ description }}</p>
		</div>
		<UAlert
			color="neutral"
			variant="soft"
			icon="material-symbols:construction-outline"
			title="Not built yet"
			:description="`Scaffolded route only. Full CRUD lands in ${phase} - see PROJECTDOC.md section 8 (Roadmap). The Categories module (sidebar, under Catalog) shows the pattern this will follow.`"
		/>
	</div>
</template>
