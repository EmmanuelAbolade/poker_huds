<!-- app/pages/admin/users/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
</script>

<template>
	<AdminComingSoon
		title="Users"
		description="View customers, manage roles, ban/unban, reset password, view activity."
		phase="Phase 1"
	/>
</template>
