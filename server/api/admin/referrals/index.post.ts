// server/api/admin/referrals/index.post.ts
// Manually record a referral link. Backed by the real database.

export default defineEventHandler(async (event) => {
	const body = await readBody<{ referrerUserId?: string, referredUserId?: string, level?: 1 | 2, earnings?: number }>(event)

	if (!body?.referrerUserId || !(await prisma.customer.findUnique({ where: { id: body.referrerUserId } }))) {
		throw createError({ statusCode: 400, statusMessage: 'A valid referrerUserId is required' })
	}
	if (!body.referredUserId || !(await prisma.customer.findUnique({ where: { id: body.referredUserId } }))) {
		throw createError({ statusCode: 400, statusMessage: 'A valid referredUserId is required' })
	}
	if (body.referrerUserId === body.referredUserId) {
		throw createError({ statusCode: 400, statusMessage: 'A user cannot refer themselves' })
	}

	const referral = await prisma.referral.create({
		data: {
			referrerUserId: body.referrerUserId,
			referredUserId: body.referredUserId,
			level: body.level === 2 ? 2 : 1,
			earnings: body.earnings ?? 0
		}
	})

	await recordAuditLog('admin_1', 'create', 'referral', referral.id)
	return referral
})
