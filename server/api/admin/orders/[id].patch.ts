// server/api/admin/orders/[id].patch.ts
// Only supported transition: refunding a paid order, which cascades to
// revoking its license in the same transaction. Backed by the real
// database - see index.get.ts's header comment for why refund is the
// only order mutation exposed.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<{ status?: string }>(event)

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
	if (body.status !== 'refunded') {
		throw createError({ statusCode: 400, statusMessage: "Only { status: 'refunded' } is supported" })
	}

	const order = await prisma.order.findUnique({ where: { id }, include: { license: true } })
	if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
	if (order.status === 'refunded') {
		throw createError({ statusCode: 409, statusMessage: 'Order is already refunded' })
	}

	const updated = await prisma.$transaction(async (tx) => {
		const updated = await tx.order.update({ where: { id }, data: { status: 'refunded' } })
		if (order.license) {
			await tx.license.update({ where: { id: order.license.id }, data: { status: 'revoked' } })
		}
		return updated
	})

	await recordAuditLog('admin_1', 'refund', 'order', id)
	return updated
})
