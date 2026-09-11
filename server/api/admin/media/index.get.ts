// server/api/admin/media/index.get.ts
// List every uploaded media asset, newest first.

export default defineEventHandler(async () => {
	const items = await prisma.mediaAsset.findMany({ orderBy: { uploadedAt: 'desc' } })
	return { items, total: items.length }
})
