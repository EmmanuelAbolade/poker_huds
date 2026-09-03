// server/api/admin/stats.get.ts
// Aggregated counts for the dashboard KPI cards. Backed by the real
// database.

export default defineEventHandler(async () => {
	const [totalHuds, publishedHuds, totalUsers, totalOrders, paidOrders, totalReferrals, flaggedReferrals] = await Promise.all([
		prisma.hud.count(),
		prisma.hud.count({ where: { status: 'published' } }),
		prisma.customer.count(),
		prisma.order.count(),
		prisma.order.findMany({ where: { status: 'paid' }, select: { amount: true } }),
		prisma.referral.count(),
		prisma.referral.count({ where: { flagged: true } })
	])

	return {
		totalHuds,
		publishedHuds,
		totalUsers,
		totalOrders,
		revenue: paidOrders.reduce((sum, o) => sum + o.amount, 0),
		totalReferrals,
		flaggedReferrals
	}
})
