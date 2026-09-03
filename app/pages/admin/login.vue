<!-- app/pages/admin/login.vue -->
<!-- Admin login page. No admin-auth middleware here (that would be a
     redirect loop) - this is the one public page under /admin. Mock
     credentials: admin@gamblin4kids.local / admin123 (see
     server/api/admin/auth/login.post.ts). -->
<script setup lang="ts">
const email = ref('admin@gamblin4kids.local')
const password = ref('')
const error = ref('')
const loading = ref(false)

const { login } = useAdminAuth()

async function onSubmit() {
	error.value = ''
	loading.value = true
	try {
		await login(email.value, password.value)
		await navigateTo('/admin')
	} catch {
		error.value = 'Invalid email or password.'
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<div class="flex min-h-screen items-center justify-center bg-default p-4">
		<UCard class="w-full max-w-sm">
			<template #header>
				<h1 class="text-lg font-semibold">Admin Console Login</h1>
				<p class="text-sm text-muted">Poker HUD Store - Gamblin4Kids</p>
			</template>

			<form class="flex flex-col gap-4" @submit.prevent="onSubmit">
				<UFormField label="Email">
					<UInput v-model="email" type="email" class="w-full" placeholder="admin@gamblin4kids.local" />
				</UFormField>

				<UFormField label="Password">
					<UInput v-model="password" type="password" class="w-full" placeholder="admin123 (mock password)" />
				</UFormField>

				<UAlert v-if="error" color="error" variant="soft" :title="error" />

				<UButton type="submit" block :loading="loading">
					Log in
				</UButton>
			</form>
		</UCard>
	</div>
</template>
