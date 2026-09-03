<!-- app/pages/admin/huds/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
</script>

<template>
	<AdminComingSoon
		title="HUD Products"
		description="Create/edit HUDs with nested situations -> screens -> pop-up images, pricing, category, publish state."
		phase="Phase 1"
	/>
</template>
