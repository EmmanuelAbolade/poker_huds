// server/api/admin/orders/index.post.ts
// Records a manual order (e.g. a comp/support-granted purchase) and
// issues its license in the same step. Normal orders will come from the
// storefront checkout flow once that exists (Phase 5) and write to this
// same collection - this endpoint is the admin-side "Create" for orders.

import type { Order, License } from '../../../../app/types/admin'

export default defineEventHandler(async (event) => {
	const body = await readBody<{ userId?: string, hudId?: string, amount?: number }>(event)

	if (!body?.userId || !findById(mockDb.customers, body.userId)) {
		throw createError({ statusCode: 400, statusMessage: 'A valid userId is required' })
	}
	const hud = findById(mockDb.huds, body?.hudId ?? '')
	if (!hud) {
		throw createError({ statusCode: 400, statusMessage: 'A valid hudId is required' })
	}

	const now = new Date().toISOString()

	const order: Order = {
		id: generateId('ord'),
		userId: body.userId,
		hudId: hud.id,
		amount: body.amount ?? hud.price,
		status: 'paid',
		purchasedAt: now
	}
	createItem(mockDb.orders, order)

	const license: License = {
		id: generateId('lic'),
		orderId: order.id,
		userId: order.userId,
		hudId: order.hudId,
		issuedAt: now,
		expiresAt: null,
		status: 'active'
	}
	createItem(mockDb.licenses, license)

	recordAuditLog('admin_1', 'create', 'order', order.id)

	return { ...order, license }
})
