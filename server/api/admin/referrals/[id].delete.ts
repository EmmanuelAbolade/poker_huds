// server/api/admin/referrals/[id].delete.ts
// Removes an erroneous referral record (e.g. a manual entry mistake).

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	const removed = removeItem(mockDb.referrals, id)
	if (!removed) throw createError({ statusCode: 404, statusMessage: 'Referral not found' })

	recordAuditLog('admin_1', 'delete', 'referral', id)
	return { ok: true }
})
