// server/api/admin/referrals/[id].delete.ts
// Removes an erroneous referral record. Backed by the real database.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	try {
		await prisma.referral.delete({ where: { id } })
	} catch (error: any) {
		if (error.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'Referral not found' })
		throw error
	}

	await recordAuditLog('admin_1', 'delete', 'referral', id)
	return { ok: true }
})
