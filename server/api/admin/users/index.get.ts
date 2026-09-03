// server/api/admin/users/index.get.ts
// List customers, newest first, with each customer's referrer name
// resolved via a self-join. Backed by the real database.

export default defineEventHandler(async () => {
	const customers = await prisma.customer.findMany({
		orderBy: { createdAt: 'desc' },
		include: { referredBy: true }
	})

	const items = customers.map(c => ({
		id: c.id,
		email: c.email,
		name: c.name,
		status: c.status,
		referredByUserId: c.referredById,
		createdAt: c.createdAt.toISOString(),
		referredByName: c.referredBy?.name ?? null
	}))

	return { items, total: items.length }
})
