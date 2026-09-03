<!-- app/pages/admin/settings/index.vue -->
<!-- System settings: one form, one Save button (see server/api/admin/
     settings/index.patch.ts for why this differs from the row-CRUD
     pattern everywhere else). Payment and storage are stub fields -
     there's no real provider wired up yet (PROJECTDOC.md section 6, Q3/
     Q4), so they're labeled as such rather than pretending to work. -->
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const toast = useToast()
const { data } = await useFetch<Record<string, string>>('/api/admin/settings')

const form = reactive({
	site_name: '',
	logo_url: '',
	payment_provider: '',
	storage_provider: '',
	referrals_enabled: 'true',
	public_signup_enabled: 'true',
	welcome_email_body: ''
})

watchEffect(() => {
	if (!data.value) return
	for (const key of Object.keys(form) as (keyof typeof form)[]) {
		if (data.value[key] !== undefined) form[key] = data.value[key]
	}
})

const referralsEnabled = computed({
	get: () => form.referrals_enabled === 'true',
	set: (v: boolean) => { form.referrals_enabled = String(v) }
})
const publicSignupEnabled = computed({
	get: () => form.public_signup_enabled === 'true',
	set: (v: boolean) => { form.public_signup_enabled = String(v) }
})

const saving = ref(false)
async function onSave() {
	saving.value = true
	try {
		await $fetch('/api/admin/settings', { method: 'PATCH', body: { ...form } })
		toast.add({ title: 'Settings saved', color: 'success' })
	} catch {
		toast.add({ title: 'Save failed', color: 'error' })
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="flex flex-col gap-6 max-w-2xl">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-xl font-semibold">Settings</h1>
				<p class="text-sm text-muted">Site identity, feature toggles, and stubs for payment/storage pending provider decisions.</p>
			</div>
			<UButton :loading="saving" @click="onSave">Save Settings</UButton>
		</div>

		<UCard>
			<template #header><p class="font-medium">General</p></template>
			<div class="flex flex-col gap-4">
				<UFormField label="Site Name">
					<UInput v-model="form.site_name" class="w-full" placeholder="Gamblin4Kids" />
				</UFormField>
				<UFormField label="Logo URL" description="Client's notes just say the logo is &quot;SIN&quot; - drop the asset URL here once received.">
					<UInput v-model="form.logo_url" class="w-full" placeholder="/img/logo.svg" />
				</UFormField>
			</div>
		</UCard>

		<UCard>
			<template #header><p class="font-medium">Feature Toggles</p></template>
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium">Referrals enabled</p>
						<p class="text-xs text-muted">Turns the referral program on/off storefront-wide.</p>
					</div>
					<USwitch v-model="referralsEnabled" />
				</div>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium">Public signup enabled</p>
						<p class="text-xs text-muted">Allow new accounts to register on the storefront.</p>
					</div>
					<USwitch v-model="publicSignupEnabled" />
				</div>
			</div>
		</UCard>

		<UCard>
			<template #header>
				<div class="flex items-center gap-2">
					<p class="font-medium">Payment</p>
					<UBadge color="warning" variant="subtle">Not wired up</UBadge>
				</div>
			</template>
			<UFormField label="Payment provider" description="No processor confirmed yet - see PROJECTDOC.md section 6, Q3.">
				<UInput v-model="form.payment_provider" class="w-full" placeholder="e.g. stripe" />
			</UFormField>
		</UCard>

		<UCard>
			<template #header>
				<div class="flex items-center gap-2">
					<p class="font-medium">Storage</p>
					<UBadge color="warning" variant="subtle">Not wired up</UBadge>
				</div>
			</template>
			<UFormField label="Storage provider" description="No provider confirmed yet - see PROJECTDOC.md section 6, Q4. HUD images/videos use plain URLs until this is set.">
				<UInput v-model="form.storage_provider" class="w-full" placeholder="e.g. cloudflare-r2" />
			</UFormField>
		</UCard>

		<UCard>
			<template #header><p class="font-medium">Email Templates</p></template>
			<UFormField label="Welcome email body" description="Plain text for now - a rich editor (TipTap is already a dependency) can replace this once templates are prioritized.">
				<UTextarea v-model="form.welcome_email_body" class="w-full" :rows="4" placeholder="Welcome to Gamblin4Kids..." />
			</UFormField>
		</UCard>
	</div>
</template>
