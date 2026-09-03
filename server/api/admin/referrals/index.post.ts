// server/api/admin/referrals/index.post.ts
// Manually record a referral link (admin correction/backfill). Normal
// referrals will be created by the storefront signup flow (Phase 5)
// reading a referral code - out of scope here, but writes to this same
// collection once it exists.

import type { Referral } from '../../../../app/types/admin'

export default defineEventHandler(async (event) => {
	const body = await readBody<{ referrerUserId?: string, referredUserId?: string, level?: 1 | 2, earnings?: number }>(event)

	if (!body?.referrerUserId || !findById(mockDb.customers, body.referrerUserId)) {
		throw createError({ statusCode: 400, statusMessage: 'A valid referrerUserId is required' })
	}
	if (!body.referredUserId || !findById(mockDb.customers, body.referredUserId)) {
		throw createError({ statusCode: 400, statusMessage: 'A valid referredUserId is required' })
	}
	if (body.referrerUserId === body.referredUserId) {
		throw createError({ statusCode: 400, statusMessage: 'A user cannot refer themselves' })
	}

	const referral: Referral = {
		id: generateId('ref'),
		referrerUserId: body.referrerUserId,
		referredUserId: body.referredUserId,
		level: body.level === 2 ? 2 : 1,
		earnings: body.earnings ?? 0,
		flagged: false,
		createdAt: new Date().toISOString()
	}

	createItem(mockDb.referrals, referral)
	recordAuditLog('admin_1', 'create', 'referral', referral.id)

	return referral
})
