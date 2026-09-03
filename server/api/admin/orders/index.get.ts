// server/api/admin/orders/index.get.ts
// List orders with user/HUD names resolved in and each order's license
// (if any) attached, so the table can show purchase + license status
// together without a second round trip.

export default defineEventHandler(async () => {
	const items = [...mockDb.orders]
		.sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))
		.map(order => ({
			...order,
			userName: mockDb.customers.find(c => c.id === order.userId)?.name ?? 'Unknown user',
			hudTitle: mockDb.huds.find(h => h.id === order.hudId)?.title ?? 'Unknown HUD',
			license: mockDb.licenses.find(l => l.orderId === order.id) ?? null
		}))

	return { items, total: items.length }
})
