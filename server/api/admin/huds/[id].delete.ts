// server/api/admin/huds/[id].delete.ts
// Deletes a HUD. Its situations/screens/popups cascade-delete
// automatically (onDelete: Cascade in the schema); orders/licenses
// referencing this HUD do NOT cascade, so deleting a HUD with purchase
// history correctly 409s (P2003) instead of orphaning those records.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	try {
		await prisma.hud.delete({ where: { id } })
	} catch (error: any) {
		if (error.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'HUD not found' })
		if (error.code === 'P2003') {
			throw createError({ statusCode: 409, statusMessage: 'HUD has orders or licenses on record and cannot be deleted' })
		}
		throw error
	}

	await recordAuditLog('admin_1', 'delete', 'hud', id)
	return { ok: true }
})
