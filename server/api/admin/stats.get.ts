// server/api/admin/stats.get.ts
// Aggregated data for the dashboard: KPI cards, a recent-orders feed, a
// quick HUD list, a sample referral tree (whichever referrer has the
// most direct referrals - just needs to be someone real to draw the
// tree from), and a revenue-by-day series for the area chart. Backed by
// the real database.

export default defineEventHandler(async () => {
	const todayStart = new Date()
	todayStart.setHours(0, 0, 0, 0)

	const [totalHuds, publishedHuds, totalUsers, totalOrders, paidOrders, totalReferrals, flaggedReferrals, recentOrdersRaw, huds] = await Promise.all([
		prisma.hud.count(),
		prisma.hud.count({ where: { status: 'published' } }),
		prisma.customer.count(),
		prisma.order.count(),
		prisma.order.findMany({ where: { status: 'paid' }, select: { amount: true, purchasedAt: true } }),
		prisma.referral.count(),
		prisma.referral.count({ where: { flagged: true } }),
		prisma.order.findMany({
			orderBy: { purchasedAt: 'desc' },
			take: 5,
			include: { user: true, hud: true }
		}),
		prisma.hud.findMany({
			orderBy: { updatedAt: 'desc' },
			take: 5,
			include: { category: true }
		})
	])

	const revenue = paidOrders.reduce((sum, o) => sum + o.amount, 0)
	const revenueToday = paidOrders
		.filter(o => o.purchasedAt >= todayStart)
		.reduce((sum, o) => sum + o.amount, 0)

	const recentOrders = recentOrdersRaw.map(o => ({
		id: o.id,
		userName: o.user.name,
		hudTitle: o.hud.title,
		status: o.status,
		amount: o.amount
	}))

	const hudsSample = huds.map(h => ({
		id: h.id,
		title: h.title,
		categoryName: h.category.name,
		status: h.status
	}))

	// Whichever referrer has the most direct referrals - just needs to be
	// a real person with real data to draw a sample tree from.
	const referralCounts = await prisma.referral.groupBy({
		by: ['referrerUserId'],
		_count: { referrerUserId: true },
		orderBy: { _count: { referrerUserId: 'desc' } },
		take: 1
	})

	let topReferrer = null
	if (referralCounts[0]) {
		const referrerId = referralCounts[0].referrerUserId
		const [referrer, referrals] = await Promise.all([
			prisma.customer.findUnique({ where: { id: referrerId } }),
			prisma.referral.findMany({ where: { referrerUserId: referrerId }, include: { referred: true } })
		])
		if (referrer) {
			topReferrer = {
				name: referrer.name,
				totalReferrals: referrals.length,
				totalEarnings: referrals.reduce((sum, r) => sum + r.earnings, 0),
				direct: referrals.filter(r => r.level === 1).map(r => r.referred.name),
				subReferrals: referrals.filter(r => r.level === 2).map(r => r.referred.name)
			}
		}
	}

	const revenueByDayMap = new Map<string, number>()
	for (const order of paidOrders) {
		const day = order.purchasedAt.toISOString().slice(0, 10)
		revenueByDayMap.set(day, (revenueByDayMap.get(day) ?? 0) + order.amount)
	}
	const revenueByDay = [...revenueByDayMap.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([day, amount]) => ({ day, amount }))

	return {
		totalHuds,
		publishedHuds,
		totalUsers,
		totalOrders,
		revenue,
		revenueToday,
		totalReferrals,
		flaggedReferrals,
		recentOrders,
		hudsSample,
		topReferrer,
		revenueByDay
	}
})
