<!-- app/pages/admin/settings/index.vue -->
<!-- Settings - redesigned to match the client's reference mockup (doc/
     IMG_20260907_164018.jpg): sectioned dark-header groups (General/
     Payment/License/Email). Fields stay always-editable with one Save
     Settings button at top, rather than a per-row Edit-button toggle -
     simpler state, and arguably better UX (no extra click before
     typing) without losing the section-grouping look the mockup is
     really about. License Settings is a new section (duration/renewal
     reminder/auto-renewal) - just new keys in the existing flexible
     key-value Setting store, no schema change needed. -->
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const toast = useToast()
const { user } = useAdminAuth()
const canEdit = computed(() => user.value?.role === 'super_admin')
const { data } = await useFetch<Record<string, string>>('/api/admin/settings')

const form = reactive({
	site_name: '',
	logo_url: '',
	payment_provider: '',
	storage_provider: '',
	referrals_enabled: 'true',
	public_signup_enabled: 'true',
	welcome_email_body: '',
	license_duration_days: '365',
	renewal_reminder_days: '14',
	auto_renewal_enabled: 'true'
})

watchEffect(() => {
	if (!data.value) return
	for (const key of Object.keys(form) as (keyof typeof form)[]) {
		if (data.value[key] !== undefined) form[key] = data.value[key]
	}
})

const referralsEnabled = computed({ get: () => form.referrals_enabled === 'true', set: (v: boolean) => { form.referrals_enabled = String(v) } })
const publicSignupEnabled = computed({ get: () => form.public_signup_enabled === 'true', set: (v: boolean) => { form.public_signup_enabled = String(v) } })
const autoRenewalEnabled = computed({ get: () => form.auto_renewal_enabled === 'true', set: (v: boolean) => { form.auto_renewal_enabled = String(v) } })

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
	<div class="flex flex-col gap-6 max-w-3xl">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-xl font-semibold">System Settings</h1>
				<p class="text-sm text-muted">Site identity, feature toggles, and stubs for payment/storage pending provider decisions.</p>
			</div>
			<UButton v-if="canEdit" :loading="saving" @click="onSave">Save Settings</UButton>
		</div>

		<UAlert v-if="!canEdit" color="neutral" variant="soft" title="View only" description="Editing Settings requires the Super Admin role." />

		<div class="rounded-lg overflow-hidden ring ring-default">
			<div class="bg-gray-800 dark:bg-gray-900 text-white px-4 py-2 text-sm font-semibold">General Settings</div>
			<div class="divide-y divide-default">
				<div class="flex items-center justify-between gap-4 px-4 py-3">
					<span class="text-sm">Site Name</span>
					<UInput v-model="form.site_name" class="w-64" :disabled="!canEdit" placeholder="Gamblin4Kids" />
				</div>
				<div class="flex items-center justify-between gap-4 px-4 py-3">
					<span class="text-sm">Logo URL <span class="text-muted text-xs">("the logo is SIN")</span></span>
					<UInput v-model="form.logo_url" class="w-64" :disabled="!canEdit" placeholder="/img/logo.svg" />
				</div>
				<div class="flex items-center justify-between gap-4 px-4 py-3">
					<span class="text-sm">Referrals Enabled</span>
					<USwitch v-model="referralsEnabled" :disabled="!canEdit" />
				</div>
				<div class="flex items-center justify-between gap-4 px-4 py-3">
					<span class="text-sm">Public Signup Enabled</span>
					<USwitch v-model="publicSignupEnabled" :disabled="!canEdit" />
				</div>
			</div>
		</div>

		<div class="rounded-lg overflow-hidden ring ring-default">
			<div class="bg-gray-800 dark:bg-gray-900 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
				Payment Settings <UBadge color="warning" variant="subtle">Not wired up</UBadge>
			</div>
			<div class="divide-y divide-default">
				<div class="flex items-center justify-between gap-4 px-4 py-3">
					<span class="text-sm">Payment Provider <span class="text-muted text-xs">(section 6, Q3)</span></span>
					<UInput v-model="form.payment_provider" class="w-64" :disabled="!canEdit" placeholder="e.g. stripe" />
				</div>
			</div>
		</div>

		<div class="rounded-lg overflow-hidden ring ring-default">
			<div class="bg-gray-800 dark:bg-gray-900 text-white px-4 py-2 text-sm font-semibold">License Settings</div>
			<div class="divide-y divide-default">
				<div class="flex items-center justify-between gap-4 px-4 py-3">
					<span class="text-sm">License Duration (days)</span>
					<UInput v-model="form.license_duration_days" type="number" class="w-64" :disabled="!canEdit" />
				</div>
				<div class="flex items-center justify-between gap-4 px-4 py-3">
					<span class="text-sm">Renewal Reminder (days before expiry)</span>
					<UInput v-model="form.renewal_reminder_days" type="number" class="w-64" :disabled="!canEdit" />
				</div>
				<div class="flex items-center justify-between gap-4 px-4 py-3">
					<span class="text-sm">Auto Renewal</span>
					<USwitch v-model="autoRenewalEnabled" :disabled="!canEdit" />
				</div>
			</div>
		</div>

		<div class="rounded-lg overflow-hidden ring ring-default">
			<div class="bg-gray-800 dark:bg-gray-900 text-white px-4 py-2 text-sm font-semibold flex items-center gap-2">
				Email Settings <UBadge color="warning" variant="subtle">Not wired up</UBadge>
			</div>
			<div class="divide-y divide-default">
				<div class="px-4 py-3">
					<p class="text-sm mb-2">Welcome Email Body <span class="text-muted text-xs">(plain text for now - TipTap is already a dependency for a future rich editor)</span></p>
					<UTextarea v-model="form.welcome_email_body" class="w-full" :rows="3" :disabled="!canEdit" placeholder="Welcome to Gamblin4Kids..." />
				</div>
				<div class="flex items-center justify-between gap-4 px-4 py-3">
					<span class="text-sm">Storage Provider <span class="text-muted text-xs">(section 6, Q4)</span></span>
					<UInput v-model="form.storage_provider" class="w-64" :disabled="!canEdit" placeholder="e.g. cloudflare-r2" />
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<AdminStatCard label="Settings Sections" value="4" icon="material-symbols:tune" color="blue" />
			<AdminStatCard label="Referrals Enabled" :value="referralsEnabled ? 'Yes' : 'No'" icon="material-symbols:hub-outline" color="green" />
			<AdminStatCard label="Auto Renewal" :value="autoRenewalEnabled ? 'Yes' : 'No'" icon="material-symbols:autorenew" color="orange" />
			<AdminStatCard label="Public Signup" :value="publicSignupEnabled ? 'Yes' : 'No'" icon="material-symbols:person-add" color="red" />
		</div>
	</div>
</template>
