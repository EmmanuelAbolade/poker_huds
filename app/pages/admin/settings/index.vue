<!-- app/pages/admin/settings/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
</script>

<template>
	<AdminComingSoon
		title="Settings"
		description="Logo, payment settings, storage settings, email templates, feature toggles."
		phase="Phase 3"
	/>
</template>
