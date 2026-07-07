<script lang="ts" setup>
	import "./assets/css/main.css"
</script>

<template>
  <div class="global-wrapper">
		<Navbar />
		<NuxtPage />
  </div>
</template>

<style scoped>
	.global-wrapper {
		height: 100vh;
		display: flex;
		flex-direction: column;
	}
</style>
