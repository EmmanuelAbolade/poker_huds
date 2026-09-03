<!-- app/app.vue -->
<!-- Root app shell. <UApp> provides Nuxt UI's toast/modal/tooltip/color-mode
     context (needed by the admin console). <NuxtLayout> picks the storefront
     "default" layout or the "admin" layout per-page - see app/layouts/. -->
<script lang="ts" setup></script>

<template>
	<UApp>
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>
