<!-- app/pages/admin/media/index.vue -->
<!-- Media library: upload images/video, browse everything uploaded,
     delete, copy the URL. Deliberately NOT wired into the HUD nested
     editor's imageUrl fields (app/pages/admin/huds/[id].vue) - those
     already take a plain URL string, so "use a media asset" is just
     copying its URL there. A picker integration is a nice-to-have once
     there's real usage, not required to make this module functional.
     Backed by a local-disk storage adapter (server/utils/storage.ts)
     pending a real provider decision - see PROJECTDOC.md section 6, Q4. -->
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type MediaAsset = { id: string, type: 'image' | 'video', url: string, uploadedAt: string }

const toast = useToast()
const { data, refresh, status: fetchStatus } = await useFetch<{ items: MediaAsset[] }>('/api/admin/media')

const pendingFiles = ref<File[] | null>(null)
const uploading = ref(false)

watch(pendingFiles, async (files) => {
	if (!files?.length) return
	uploading.value = true
	try {
		const form = new FormData()
		for (const file of files) form.append('file', file)
		await $fetch('/api/admin/media', { method: 'POST', body: form })
		toast.add({ title: `Uploaded ${files.length} file(s)`, color: 'success' })
		await refresh()
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Upload failed', color: 'error' })
	} finally {
		pendingFiles.value = null
		uploading.value = false
	}
})

async function onDelete(asset: MediaAsset) {
	if (!confirm('Delete this file? This cannot be undone.')) return
	try {
		await $fetch(`/api/admin/media/${asset.id}`, { method: 'DELETE' })
		toast.add({ title: 'Deleted', color: 'success' })
		await refresh()
	} catch (err: any) {
		toast.add({ title: err?.data?.statusMessage ?? 'Delete failed', color: 'error' })
	}
}

async function copyUrl(asset: MediaAsset) {
	await navigator.clipboard.writeText(asset.url)
	toast.add({ title: 'URL copied', description: asset.url, color: 'success' })
}
</script>

<template>
	<div class="flex flex-col gap-6">
		<div>
			<h1 class="text-xl font-semibold">Media</h1>
			<p class="text-sm text-muted">Upload images/video, then copy a file's URL into a HUD's situation/screen/pop-up fields.</p>
		</div>

		<UFileUpload
			v-model="pendingFiles"
			multiple
			accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
			label="Drop images or video here"
			description="PNG, JPEG, WEBP, GIF, MP4, WEBM"
			:disabled="uploading"
		/>

		<div v-if="fetchStatus === 'pending'" class="text-sm text-muted">Loading...</div>

		<div v-else-if="!data?.items?.length" class="text-sm text-muted">No media uploaded yet.</div>

		<div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
			<UCard v-for="asset in data.items" :key="asset.id" class="min-w-0">
				<div class="aspect-video bg-elevated rounded-md overflow-hidden flex items-center justify-center mb-3">
					<img v-if="asset.type === 'image'" :src="asset.url" :alt="asset.url" class="w-full h-full object-cover">
					<video v-else :src="asset.url" class="w-full h-full object-cover" muted />
				</div>
				<p class="text-xs text-muted truncate mb-2" :title="asset.url">{{ asset.url }}</p>
				<div class="flex gap-2">
					<UButton size="xs" color="neutral" variant="soft" class="flex-1" @click="copyUrl(asset)">Copy URL</UButton>
					<UButton size="xs" color="error" variant="soft" @click="onDelete(asset)">Delete</UButton>
				</div>
			</UCard>
		</div>
	</div>
</template>
