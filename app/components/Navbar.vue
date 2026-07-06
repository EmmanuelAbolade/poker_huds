<script setup lang="ts"></script>

<template>
	<div class="wrapper global-container">
		<div class="nav-section left-side logo-container">
			<h1 class='logo-txt'>Gamblin4Kids</h1>
		</div>

		<div class="nav-section center">
			<GlobalTxtInput class="search-input" placeholder="Search" />
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

		gap: 2rem;
		font-size: 15px;
	}

	.nav-section {
		flex-shrink: 0;
	}

	.right-side {
		display: flex;
		gap: 1rem;
	}

	.btn, .search-input {
		font-size: 1.5rem;
	}

</style>
