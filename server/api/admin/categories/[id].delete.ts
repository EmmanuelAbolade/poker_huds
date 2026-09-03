// server/api/admin/categories/[id].delete.ts
// Delete a category. Real-world version would block/warn when HUDs still
// reference this category - out of scope until HUD CRUD (Phase 1) lands.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	const removed = removeItem(mockDb.categories, id)
	if (!removed) throw createError({ statusCode: 404, statusMessage: 'Category not found' })

	recordAuditLog('admin_1', 'delete', 'category', id)
	return { ok: true }
})
