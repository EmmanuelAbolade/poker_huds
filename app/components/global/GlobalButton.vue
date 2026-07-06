<template>
	<button class="btn"><slot /></button>
</template>

<style scoped>
	.btn {
		padding: .5rem 1rem;
		border-radius: .5rem;
		font-family: "Figtree", sans-serif;
		border: 2px solid var(--primary-clr-2);
		background: var(--background-secondary);
		color: var(--primary-clr-2);
		box-shadow: .3rem .2rem .5rem #0008;
		transition: all 299ms ease;
	}

	.btn:hover {
		border-radius: 0;
		border-color: var(--primary-clr-1);
		color: var(--primary-clr-1);
		font-weight: 800;

		box-shadow: .3rem .2rem .5rem var(--primary-clr-1-op);
	}
</style>
