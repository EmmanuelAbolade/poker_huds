// server/api/admin/analytics.get.ts
// Aggregates for the Analytics page: revenue by day, best-selling HUDs,
// referral earnings by referrer, and the active/banned user split.
// Backed by the real database - grouping happens in JS rather than SQL
// GROUP BY for the day-bucket and per-referrer sums, since the volumes
// here are small admin-console aggregates, not a high-traffic query path.

export default defineEventHandler(async () => {
	const paidOrders = await prisma.order.findMany({
		where: { status: 'paid' },
		include: { hud: true }
	})

	const revenueByDayMap = new Map<string, number>()
	for (const order of paidOrders) {
		const day = order.purchasedAt.toISOString().slice(0, 10)
		revenueByDayMap.set(day, (revenueByDayMap.get(day) ?? 0) + order.amount)
	}
	const revenueByDay = [...revenueByDayMap.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([day, amount]) => ({ label: day, value: amount }))

	const hudOrderCounts = new Map<string, { title: string, orders: number, revenue: number }>()
	for (const order of paidOrders) {
		const entry = hudOrderCounts.get(order.hudId) ?? { title: order.hud.title, orders: 0, revenue: 0 }
		entry.orders += 1
		entry.revenue += order.amount
		hudOrderCounts.set(order.hudId, entry)
	}
	const popularHuds = [...hudOrderCounts.values()]
		.map(entry => ({ label: entry.title, value: entry.orders, revenue: entry.revenue }))
		.sort((a, b) => b.value - a.value)

	const referrals = await prisma.referral.findMany({ include: { referrer: true } })
	const earningsByReferrer = new Map<string, number>()
	for (const referral of referrals) {
		earningsByReferrer.set(referral.referrer.name, (earningsByReferrer.get(referral.referrer.name) ?? 0) + referral.earnings)
	}
	const referralEarnings = [...earningsByReferrer.entries()]
		.map(([label, value]) => ({ label, value }))
		.sort((a, b) => b.value - a.value)

	const [activeUsers, bannedUsers] = await Promise.all([
		prisma.customer.count({ where: { status: 'active' } }),
		prisma.customer.count({ where: { status: 'banned' } })
	])

	return {
		revenueByDay,
		popularHuds,
		referralEarnings,
		userActivity: { active: activeUsers, banned: bannedUsers }
	}
})
