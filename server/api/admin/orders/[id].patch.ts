// server/api/admin/orders/[id].patch.ts
// Currently the only supported transition is refunding a paid order -
// which cascades to revoking its license, since a refunded purchase
// shouldn't leave active access behind. Modeled as a PATCH with
// { status: 'refunded' } rather than a separate /refund route so it
// reads as "update the order's state," matching the other CRUD modules.

import type { Order } from '../../../../app/types/admin'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<{ status?: Order['status'] }>(event)

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
	if (body.status !== 'refunded') {
		throw createError({ statusCode: 400, statusMessage: "Only { status: 'refunded' } is supported" })
	}

	const order = findById(mockDb.orders, id)
	if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
	if (order.status === 'refunded') {
		throw createError({ statusCode: 409, statusMessage: 'Order is already refunded' })
	}

	const updated = updateItem<Order>(mockDb.orders, id, { status: 'refunded' })

	const license = mockDb.licenses.find(l => l.orderId === id)
	if (license) {
		updateItem(mockDb.licenses, license.id, { status: 'revoked' })
	}

	recordAuditLog('admin_1', 'refund', 'order', id)
	return updated
})
