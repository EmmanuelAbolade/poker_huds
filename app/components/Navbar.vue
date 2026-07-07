<script setup lang="ts"></script>

<template>
	<div class="wrapper global-container">
		<div class="nav-section left-side logo-container">
			<h1 class='logo-txt'>Gamblin4Kids</h1>
		</div>

		<div class="nav-section center">
			<GlobalTxtInput class="search-input" placeholder="Search" />
			<GlobalButton class=btn><Icon name="material-symbols:search-rounded" style="color: var(--primary-clr-2)" /></GlobalButton>
		</div>

		<div class="nav-section right-side">
			<GlobalButton class="btn">Login</GlobalButton>
			<GlobalButton class="btn">Sign Up</GlobalButton>
		</div>
	</div>
</template>

<style scoped>

	.wrapper {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--background-secondary);
		height: 8vh;
		border-bottom: 2px solid var(--primary-clr-2);

		font-size: 15px;
	}

	.nav-section {
		display: flex;
		flex-wrap: nowrap;
		flex-shrink: 0;
	}

	.center {
		gap: var(--default-gap);
	}

	.right-side {
		display: flex;
		gap: var(--default-gap);
	}

	.btn, .search-input {
		font-size: 1.5rem;
	}

</style>
