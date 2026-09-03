<!-- app/pages/admin/huds/[id].vue -->
<!-- HUD detail/edit page: basic fields + the full nested situations ->
     screens -> pop-up images tree (PROJECTDOC.md section 4). The nested
     tree is edited entirely client-side as a local reactive copy and
     saved in one PATCH request (see the header comment on
     server/api/admin/huds/[id].patch.ts for why - granular REST endpoints
     per situation/screen/popup would be a lot of surface area for a mock
     data layer that's going to be replaced anyway). Image fields take a
     URL for now - real upload comes with the Media module + a storage
     provider decision (PROJECTDOC.md section 7, Q4). -->
<script setup lang="ts">
import type { Category, Hud, Situation, Screen } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const route = useRoute()
const hudId = route.params.id as string
const toast = useToast()

const { data: hud } = await useFetch<Hud>(`/api/admin/huds/${hudId}`)
if (!hud.value) {
	throw createError({ statusCode: 404, statusMessage: 'HUD not found', fatal: true })
}

const { data: categoriesData } = await useFetch<{ items: Category[] }>('/api/admin/categories')

const form = reactive({
	title: hud.value.title,
	description: hud.value.description,
	price: hud.value.price,
	categoryId: hud.value.categoryId,
	status: hud.value.status,
	situations: JSON.parse(JSON.stringify(hud.value.situations)) as Situation[]
})

const saving = ref(false)
const deleting = ref(false)

function addSituation() {
	form.situations.push({
		id: crypto.randomUUID(),
		hudId,
		title: 'New situation',
		sortOrder: form.situations.length + 1,
		screens: []
	})
}

function removeSituation(index: number) {
	form.situations.splice(index, 1)
}

function addScreen(situation: Situation) {
	situation.screens.push({
		id: crypto.randomUUID(),
		situationId: situation.id,
		imageUrl: '',
		sortOrder: situation.screens.length + 1,
		popups: []
	})
}

function removeScreen(situation: Situation, index: number) {
	situation.screens.splice(index, 1)
}

function addPopup(screen: Screen) {
	screen.popups.push({ id: crypto.randomUUID(), screenId: screen.id, imageUrl: '', label: '' })
}

function removePopup(screen: Screen, index: number) {
	screen.popups.splice(index, 1)
}

async function onSave() {
	if (!form.title.trim() || !form.categoryId) {
		toast.add({ title: 'Title and category are required', color: 'error' })
		return
	}

	saving.value = true
	try {
		await $fetch(`/api/admin/huds/${hudId}`, { method: 'PATCH', body: { ...form } })
		toast.add({ title: 'HUD saved', color: 'success' })
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Save failed', color: 'error' })
	} finally {
		saving.value = false
	}
}

async function onDelete() {
	if (!confirm(`Delete HUD "${form.title}"? This cannot be undone.`)) return

	deleting.value = true
	try {
		await $fetch(`/api/admin/huds/${hudId}`, { method: 'DELETE' })
		toast.add({ title: 'HUD deleted', color: 'success' })
		await navigateTo('/admin/huds')
	} catch {
		toast.add({ title: 'Delete failed', color: 'error' })
		deleting.value = false
	}
}
</script>

<template>
	<div class="flex flex-col gap-6 max-w-4xl">
		<div class="flex items-center justify-between">
			<div>
				<UButton to="/admin/huds" size="xs" color="neutral" variant="ghost" icon="material-symbols:arrow-back">
					Back to HUD Products
				</UButton>
				<h1 class="text-xl font-semibold mt-1">{{ form.title || 'HUD' }}</h1>
			</div>
			<div class="flex gap-2">
				<UButton color="error" variant="soft" :loading="deleting" @click="onDelete">Delete HUD</UButton>
				<UButton :loading="saving" @click="onSave">Save</UButton>
			</div>
		</div>

		<UCard>
			<template #header><p class="font-medium">Basic info</p></template>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<UFormField label="Title" class="sm:col-span-2">
					<UInput v-model="form.title" class="w-full" />
				</UFormField>
				<UFormField label="Description" class="sm:col-span-2">
					<UTextarea v-model="form.description" class="w-full" :rows="3" />
				</UFormField>
				<UFormField label="Price ($)">
					<UInput v-model.number="form.price" type="number" class="w-full" />
				</UFormField>
				<UFormField label="Category">
					<USelect
						v-model="form.categoryId"
						class="w-full"
						:items="(categoriesData?.items ?? []).map(c => ({ label: c.name, value: c.id }))"
					/>
				</UFormField>
				<UFormField label="Status">
					<USelect
						v-model="form.status"
						class="w-full"
						:items="[{ label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }]"
					/>
				</UFormField>
			</div>
		</UCard>

		<div class="flex items-center justify-between">
			<p class="font-medium">Situations ({{ form.situations.length }})</p>
			<UButton size="sm" color="neutral" variant="soft" icon="material-symbols:add" @click="addSituation">
				Add Situation
			</UButton>
		</div>

		<UCard v-for="(situation, sIndex) in form.situations" :key="situation.id">
			<template #header>
				<div class="flex items-center gap-2">
					<UInput v-model="situation.title" class="flex-1" placeholder="Situation title" />
					<UButton size="xs" color="error" variant="soft" icon="material-symbols:delete-outline" @click="removeSituation(sIndex)" />
				</div>
			</template>

			<div class="flex flex-col gap-4">
				<div v-for="(screen, scIndex) in situation.screens" :key="screen.id" class="border border-default rounded-md p-3 flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<UInput v-model="screen.imageUrl" class="flex-1" placeholder="Screen image URL" />
						<UButton size="xs" color="error" variant="soft" icon="material-symbols:delete-outline" @click="removeScreen(situation, scIndex)" />
					</div>

					<div v-if="screen.popups.length" class="flex flex-col gap-2 pl-4 border-l-2 border-default">
						<div v-for="(popup, pIndex) in screen.popups" :key="popup.id" class="flex items-center gap-2">
							<UInput v-model="popup.label" class="w-40" placeholder="Pop-up label" />
							<UInput v-model="popup.imageUrl" class="flex-1" placeholder="Pop-up image URL" />
							<UButton size="xs" color="error" variant="ghost" icon="material-symbols:close" @click="removePopup(screen, pIndex)" />
						</div>
					</div>

					<UButton size="xs" color="neutral" variant="ghost" icon="material-symbols:add" class="self-start" @click="addPopup(screen)">
						Add Pop-up
					</UButton>
				</div>

				<UButton size="sm" color="neutral" variant="soft" icon="material-symbols:add" class="self-start" @click="addScreen(situation)">
					Add Screen
				</UButton>
			</div>
		</UCard>

		<UAlert
			v-if="!form.situations.length"
			color="neutral"
			variant="soft"
			title="No situations yet"
			description="Add at least one situation, then screens within it, to build out this HUD's preview."
		/>
	</div>
</template>
