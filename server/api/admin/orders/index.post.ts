// server/api/admin/orders/index.post.ts
// Records a manual order and issues its license in one transaction.
// Backed by the real database.

export default defineEventHandler(async (event) => {
	const body = await readBody<{ userId?: string, hudId?: string, amount?: number }>(event)

	if (!body?.userId || !(await prisma.customer.findUnique({ where: { id: body.userId } }))) {
		throw createError({ statusCode: 400, statusMessage: 'A valid userId is required' })
	}
	const hud = await prisma.hud.findUnique({ where: { id: body?.hudId ?? '' } })
	if (!hud) {
		throw createError({ statusCode: 400, statusMessage: 'A valid hudId is required' })
	}

	const { order, license } = await prisma.$transaction(async (tx) => {
		const order = await tx.order.create({
			data: { userId: body.userId!, hudId: hud.id, amount: body.amount ?? hud.price, status: 'paid' }
		})
		const license = await tx.license.create({
			data: { orderId: order.id, userId: order.userId, hudId: order.hudId }
		})
		return { order, license }
	})

	await recordAuditLog('admin_1', 'create', 'order', order.id)

	return { ...order, license }
})
