<!-- app/pages/admin/media/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
</script>

<template>
	<AdminComingSoon
		title="Media"
		description="Upload/replace/delete HUD images and video backgrounds, browsable by HUD/situation/screen."
		phase="Phase 1"
	/>
</template>
