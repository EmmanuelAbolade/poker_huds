<!-- app/pages/admin/referrals/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
</script>

<template>
	<AdminComingSoon
		title="Referrals"
		description="Referral tree view (direct + sub-referrals), earnings, conversion, flag/ban abuse, export data - the module the client specifically called out."
		phase="Phase 2"
	/>
</template>
