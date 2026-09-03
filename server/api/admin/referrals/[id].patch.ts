// server/api/admin/referrals/[id].patch.ts
// Adjust a referral's earnings and/or toggle its flagged (suspected
// abuse) state - the two admin controls the client specifically asked
// for ("control what could be done online").

import type { Referral } from '../../../../app/types/admin'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<Partial<Pick<Referral, 'earnings' | 'flagged'>>>(event)

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	const updated = updateItem<Referral>(mockDb.referrals, id, body)
	if (!updated) throw createError({ statusCode: 404, statusMessage: 'Referral not found' })

	recordAuditLog('admin_1', body.flagged !== undefined ? `set-flagged:${body.flagged}` : 'update', 'referral', id)
	return updated
})
