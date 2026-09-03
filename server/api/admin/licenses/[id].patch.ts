// server/api/admin/licenses/[id].patch.ts
// Manage a license directly: extend/set expiresAt, revoke, or reactivate.
// Separate from orders/[id].patch.ts because a license can be managed
// independently of a refund (e.g. extending access as a goodwill gesture,
// or revoking for policy reasons without refunding the purchase).

import type { License } from '../../../../app/types/admin'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<Partial<Pick<License, 'status' | 'expiresAt'>>>(event)

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	const updated = updateItem<License>(mockDb.licenses, id, body)
	if (!updated) throw createError({ statusCode: 404, statusMessage: 'License not found' })

	recordAuditLog('admin_1', 'update', 'license', id)
	return updated
})
