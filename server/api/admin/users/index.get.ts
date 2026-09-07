// server/api/admin/users/index.get.ts
// List customers, newest first, with each customer's referrer name
// resolved via a self-join plus real purchase/referral counts for the
// redesigned list table. Backed by the real database.

export default defineEventHandler(async () => {
	const customers = await prisma.customer.findMany({
		orderBy: { createdAt: 'desc' },
		include: {
			referredBy: true,
			_count: { select: { orders: true, referralsMade: true } }
		}
	})

	const items = customers.map(c => ({
		id: c.id,
		email: c.email,
		name: c.name,
		status: c.status,
		referredByUserId: c.referredById,
		createdAt: c.createdAt.toISOString(),
		referredByName: c.referredBy?.name ?? null,
		purchaseCount: c._count.orders,
		referralCount: c._count.referralsMade
	}))

	return { items, total: items.length }
})
