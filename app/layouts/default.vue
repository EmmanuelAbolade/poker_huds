<!-- app/layouts/default.vue -->
<!-- Storefront layout: the original app.vue chrome (Navbar + page), unchanged.
     The /admin console uses app/layouts/admin.vue instead - see that file. -->
<script setup lang="ts"></script>

<template>
	<div class="global-wrapper">
		<Navbar />
		<slot />
	</div>
</template>

<style scoped>
	.global-wrapper {
		height: 100vh;
		display: flex;
		flex-direction: column;
	}
</style>
