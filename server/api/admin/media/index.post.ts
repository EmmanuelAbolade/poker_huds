// server/api/admin/media/index.post.ts
// Accepts a multipart upload (one or more files), saves each via the
// storage adapter (server/utils/storage.ts), and creates a MediaAsset
// row per file. Images and common video types only - anything else is
// rejected rather than silently accepted.

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

export default defineEventHandler(async (event) => {
	const actor = requireRole(event, ['admin', 'super_admin'])

	const parts = await readMultipartFormData(event)
	if (!parts?.length) {
		throw createError({ statusCode: 400, statusMessage: 'No file(s) provided' })
	}

	const created = []
	for (const part of parts) {
		if (!part.filename || !part.type) continue // skip non-file form fields

		const isImage = IMAGE_TYPES.has(part.type)
		const isVideo = VIDEO_TYPES.has(part.type)
		if (!isImage && !isVideo) {
			throw createError({ statusCode: 400, statusMessage: `Unsupported file type: ${part.type}` })
		}

		const url = await saveFile(part.data, part.filename)
		const asset = await prisma.mediaAsset.create({
			data: { type: isImage ? 'image' : 'video', url }
		})
		created.push(asset)
		await recordAuditLog(actor.id, 'create', 'media_asset', asset.id)
	}

	return { items: created }
})
