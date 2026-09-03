// server/api/admin/analytics.get.ts
// Aggregates for the Analytics page: revenue by day, best-selling HUDs,
// referral earnings by referrer, and the active/banned user split. Same
// "one place computes this" shape as stats.get.ts, just entity-specific.

export default defineEventHandler(async () => {
	const paidOrders = mockDb.orders.filter(o => o.status === 'paid')

	const revenueByDayMap = new Map<string, number>()
	for (const order of paidOrders) {
		const day = order.purchasedAt.slice(0, 10)
		revenueByDayMap.set(day, (revenueByDayMap.get(day) ?? 0) + order.amount)
	}
	const revenueByDay = [...revenueByDayMap.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([day, amount]) => ({ label: day, value: amount }))

	const hudOrderCounts = new Map<string, { orders: number, revenue: number }>()
	for (const order of paidOrders) {
		const entry = hudOrderCounts.get(order.hudId) ?? { orders: 0, revenue: 0 }
		entry.orders += 1
		entry.revenue += order.amount
		hudOrderCounts.set(order.hudId, entry)
	}
	const popularHuds = [...hudOrderCounts.entries()]
		.map(([hudId, entry]) => ({
			label: mockDb.huds.find(h => h.id === hudId)?.title ?? 'Unknown HUD',
			value: entry.orders,
			revenue: entry.revenue
		}))
		.sort((a, b) => b.value - a.value)

	const earningsByReferrer = new Map<string, number>()
	for (const referral of mockDb.referrals) {
		earningsByReferrer.set(referral.referrerUserId, (earningsByReferrer.get(referral.referrerUserId) ?? 0) + referral.earnings)
	}
	const referralEarnings = [...earningsByReferrer.entries()]
		.map(([userId, value]) => ({ label: mockDb.customers.find(c => c.id === userId)?.name ?? 'Unknown user', value }))
		.sort((a, b) => b.value - a.value)

	const activeUsers = mockDb.customers.filter(c => c.status === 'active').length
	const bannedUsers = mockDb.customers.filter(c => c.status === 'banned').length

	return {
		revenueByDay,
		popularHuds,
		referralEarnings,
		userActivity: { active: activeUsers, banned: bannedUsers }
	}
})
