// server/api/admin/users/[id].delete.ts
// Deletes a customer. A production version would likely soft-delete
// (archive) to preserve order/license history integrity - deferred until
// Orders/Licenses (Phase 2) exist to actually reference customers.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	const removed = removeItem(mockDb.customers, id)
	if (!removed) throw createError({ statusCode: 404, statusMessage: 'User not found' })

	recordAuditLog('admin_1', 'delete', 'customer', id)
	return { ok: true }
})
