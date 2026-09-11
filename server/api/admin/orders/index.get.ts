// server/api/admin/orders/index.get.ts
// List orders with user/HUD names and each order's license joined in.
// Backed by the real database.

export default defineEventHandler(async () => {
	const orders = await prisma.order.findMany({
		orderBy: { purchasedAt: 'desc' },
		include: { user: true, hud: true, license: true }
	})

	const items = orders.map(o => ({
		id: o.id,
		userId: o.userId,
		hudId: o.hudId,
		amount: o.amount,
		status: o.status,
		purchasedAt: o.purchasedAt.toISOString(),
		userName: o.user.name,
		hudTitle: o.hud.title,
		license: o.license
			? { ...o.license, issuedAt: o.license.issuedAt.toISOString(), expiresAt: o.license.expiresAt?.toISOString() ?? null }
			: null
	}))

	return { items, total: items.length }
})
