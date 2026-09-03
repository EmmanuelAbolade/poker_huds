// server/api/admin/referrals/[id].patch.ts
// Adjust earnings and/or toggle flagged (suspected abuse). Backed by the
// real database.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<{ earnings?: number, flagged?: boolean }>(event)

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	let updated
	try {
		updated = await prisma.referral.update({ where: { id }, data: body })
	} catch (error: any) {
		if (error.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'Referral not found' })
		throw error
	}

	await recordAuditLog('admin_1', body.flagged !== undefined ? `set-flagged:${body.flagged}` : 'update', 'referral', id)
	return updated
})
