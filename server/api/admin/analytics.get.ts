// server/api/admin/analytics.get.ts
// Aggregates for the redesigned Analytics page (doc/IMG_2026090*.jpg
// reference): a colorful KPI row, revenue/orders/license charts, a real
// key-metrics table, and a recent-activity feed. Backed by the real
// database.
//
// Deliberately does NOT show metrics we have no real data for -
// "Conversion Rate" and "Stripe Success Rate" from the reference mockup
// would need site-traffic tracking and a real payment gateway
// integration, neither of which exist. Showing invented numbers next to
// real revenue figures would be misleading to whoever reads this
// (including the client) - the Key Metrics section only surfaces things
// genuinely computable from what's actually recorded. Where a change
// badge makes sense (revenue, orders), it's a real period-over-period
// comparison, not a placeholder percentage.

export default defineEventHandler(async () => {
	const now = new Date()
	const period30Start = new Date(now)
	period30Start.setDate(period30Start.getDate() - 30)
	const priorPeriodStart = new Date(period30Start)
	priorPeriodStart.setDate(priorPeriodStart.getDate() - 30)

	const [allOrders, allLicenses, allReferrals, totalUsers, totalHuds] = await Promise.all([
		prisma.order.findMany({ include: { hud: true } }),
		prisma.license.findMany(),
		prisma.referral.findMany(),
		prisma.customer.count(),
		prisma.hud.count()
	])

	function pctChange(current: number, prior: number): string | null {
		if (prior === 0) return null
		return `${current >= prior ? '+' : ''}${Math.round(((current - prior) / prior) * 100)}%`
	}

	const paidOrders = allOrders.filter(o => o.status === 'paid')
	const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0)

	const currentPeriodRevenue = paidOrders.filter(o => o.purchasedAt >= period30Start).reduce((s, o) => s + o.amount, 0)
	const priorPeriodRevenue = paidOrders.filter(o => o.purchasedAt >= priorPeriodStart && o.purchasedAt < period30Start).reduce((s, o) => s + o.amount, 0)

	const currentPeriodOrders = allOrders.filter(o => o.purchasedAt >= period30Start).length
	const priorPeriodOrders = allOrders.filter(o => o.purchasedAt >= priorPeriodStart && o.purchasedAt < period30Start).length

	const kpis = {
		totalRevenue,
		totalRevenueChange: pctChange(currentPeriodRevenue, priorPeriodRevenue),
		activeLicenses: allLicenses.filter(l => l.status === 'active').length,
		newOrders: currentPeriodOrders,
		newOrdersChange: pctChange(currentPeriodOrders, priorPeriodOrders),
		pendingPayments: allOrders.filter(o => o.status === 'pending').length
	}

	const revenueByDayMap = new Map<string, number>()
	for (const order of paidOrders) {
		const day = order.purchasedAt.toISOString().slice(0, 10)
		revenueByDayMap.set(day, (revenueByDayMap.get(day) ?? 0) + order.amount)
	}
	const revenueByDay = [...revenueByDayMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, amount]) => ({ day, amount }))

	const ordersBreakdown = {
		paid: allOrders.filter(o => o.status === 'paid').length,
		pending: allOrders.filter(o => o.status === 'pending').length,
		refunded: allOrders.filter(o => o.status === 'refunded').length
	}

	const licenseActivity = {
		active: allLicenses.filter(l => l.status === 'active').length,
		expired: allLicenses.filter(l => l.status === 'expired').length,
		revoked: allLicenses.filter(l => l.status === 'revoked').length
	}

	const refundedCount = allOrders.filter(o => o.status === 'refunded').length
	const keyMetrics = {
		averageOrderValue: paidOrders.length ? Math.round((totalRevenue / paidOrders.length) * 100) / 100 : 0,
		refundRate: allOrders.length ? Math.round((refundedCount / allOrders.length) * 1000) / 10 : 0,
		totalPaidOrders: paidOrders.length,
		activeLicenseRate: allLicenses.length ? Math.round((licenseActivity.active / allLicenses.length) * 1000) / 10 : 0
	}

	const orderActivity = allOrders
		.sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())
		.slice(0, 4)
		.map(o => ({
			type: o.status === 'refunded' ? 'refund' : 'order',
			title: o.status === 'refunded' ? 'Refund Issued' : 'New Order',
			subtitle: `"${o.hud.title}" - $${o.amount}`,
			date: o.purchasedAt.toISOString()
		}))
	const referralActivity = allReferrals
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
		.slice(0, 2)
		.map(r => ({ type: 'referral', title: 'New Referral', subtitle: `$${r.earnings} earnings recorded`, date: r.createdAt.toISOString() }))
	const recentActivity = [...orderActivity, ...referralActivity]
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, 6)

	return {
		kpis,
		revenueByDay,
		ordersBreakdown,
		licenseActivity,
		keyMetrics,
		recentActivity,
		totals: {
			totalUsers,
			totalHuds,
			totalHudsSold: paidOrders.length,
			totalReferrals: allReferrals.length,
			flaggedReferrals: allReferrals.filter(r => r.flagged).length
		}
	}
})
