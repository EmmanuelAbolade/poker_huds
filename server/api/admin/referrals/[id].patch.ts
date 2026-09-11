// server/api/admin/referrals/[id].patch.ts
// Adjust earnings and/or toggle flagged (suspected abuse). Backed by the
// real database. Flag/unflag is a moderation action (moderators can do
// it); adjusting earnings is a financial change (admin/super_admin
// only) - see server/utils/permissions.ts for the full role matrix.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<{ earnings?: number, flagged?: boolean }>(event)
	const isFlagOnlyChange = body.flagged !== undefined && body.earnings === undefined
	const actor = requireRole(event, isFlagOnlyChange ? ['moderator', 'admin', 'super_admin'] : ['admin', 'super_admin'])

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	let updated
	try {
		updated = await prisma.referral.update({ where: { id }, data: body })
	} catch (error: any) {
		if (error.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'Referral not found' })
		throw error
	}

	await recordAuditLog(actor.id, body.flagged !== undefined ? `set-flagged:${body.flagged}` : 'update', 'referral', id)
	return updated
})
