<!-- app/pages/admin/orders/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
</script>

<template>
	<AdminComingSoon
		title="Orders & Licenses"
		description="View purchases, process refunds, manage license expiration/renewal and access rights."
		phase="Phase 2"
	/>
</template>
