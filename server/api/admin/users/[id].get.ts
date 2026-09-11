// server/api/admin/users/[id].get.ts
// Fetch one customer with their full purchase history and referral
// stats - used by the Users list page's master-detail panel (the list
// endpoint only returns counts, this returns the actual records).

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	const customer = await prisma.customer.findUnique({
		where: { id },
		include: {
			orders: { include: { hud: true, license: true }, orderBy: { purchasedAt: 'desc' } },
			referralsMade: { include: { referred: true } }
		}
	})
	if (!customer) throw createError({ statusCode: 404, statusMessage: 'User not found' })

	return {
		id: customer.id,
		name: customer.name,
		email: customer.email,
		status: customer.status,
		createdAt: customer.createdAt.toISOString(),
		purchases: customer.orders.map(o => ({
			id: o.id,
			hudTitle: o.hud.title,
			amount: o.amount,
			status: o.status,
			purchasedAt: o.purchasedAt.toISOString(),
			licenseExpiresAt: o.license?.expiresAt?.toISOString() ?? null,
			licenseStatus: o.license?.status ?? null
		})),
		referrals: {
			total: customer.referralsMade.length,
			totalEarnings: customer.referralsMade.reduce((sum, r) => sum + r.earnings, 0),
			direct: customer.referralsMade.filter(r => r.level === 1).map(r => r.referred.name),
			sub: customer.referralsMade.filter(r => r.level === 2).map(r => r.referred.name)
		}
	}
})
