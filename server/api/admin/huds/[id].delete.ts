// server/api/admin/huds/[id].delete.ts
// Deletes a HUD outright. A production version would likely block/soft-
// delete when licenses reference it (Orders/Licenses land in Phase 2).

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	const removed = removeItem(mockDb.huds, id)
	if (!removed) throw createError({ statusCode: 404, statusMessage: 'HUD not found' })

	recordAuditLog('admin_1', 'delete', 'hud', id)
	return { ok: true }
})
