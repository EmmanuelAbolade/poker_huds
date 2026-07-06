
<script lang="ts" setup>
	const props = defineProps(['placeholder'])
</script>

<template>
	<input class="input" type="text" :placeholder="props.placeholder">
</template>

<style scoped>
	.input {
		padding: .5rem 1rem;
		border-radius: .5rem;
		font-family: "Figtree", sans-serif;
		border: 2px solid var(--primary-clr-2);
		background: var(--background-secondary);
		color: var(--primary-clr-2);
	}
</style>
