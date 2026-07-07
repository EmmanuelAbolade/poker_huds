
<script lang="ts" setup>
	const props = defineProps(['placeholder'])
</script>

<template>
	<input class="input" type="text" :placeholder="props.placeholder">
</template>

<style scoped>
	.input {
		padding: .5rem 1rem;
		font-family: "Figtree", sans-serif;
		border: 1px solid var(--primary-clr-2);
		background: var(--background-secondary);
		color: var(--primary-clr-2);
		transition: all 299ms ease, transform 150ms ease;
		outline: none;
		font-weight: 100;
	}

	.input:hover, .input:focus{
		border-radius: 0;
		border-color: var(--primary-clr-1);

		box-shadow: .3rem .2rem .5rem var(--primary-clr-1-op);
	}

</style>
