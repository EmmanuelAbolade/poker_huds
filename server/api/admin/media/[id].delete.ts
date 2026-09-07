// server/api/admin/media/[id].delete.ts
// Deletes a media asset: removes the DB record and the underlying file
// via the storage adapter. Doesn't check whether a HUD/situation/screen
// still references this URL - see the schema comment on MediaAsset for
// why that's a loose, unenforced relationship.

export default defineEventHandler(async (event) => {
	const actor = requireRole(event, ['admin', 'super_admin'])
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	const asset = await prisma.mediaAsset.findUnique({ where: { id } })
	if (!asset) throw createError({ statusCode: 404, statusMessage: 'Media asset not found' })

	await prisma.mediaAsset.delete({ where: { id } })
	await deleteFile(asset.url)

	await recordAuditLog(actor.id, 'delete', 'media_asset', id)
	return { ok: true }
})
