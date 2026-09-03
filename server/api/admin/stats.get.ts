// server/api/admin/stats.get.ts
// Aggregated counts for the dashboard KPI cards. Reads the mock store
// directly - trivial today, but keeps the "one place computes stats"
// shape that will matter once this reads from a real database.

export default defineEventHandler(async () => {
	return {
		totalHuds: mockDb.huds.length,
		publishedHuds: mockDb.huds.filter(h => h.status === 'published').length,
		totalUsers: mockDb.customers.length,
		totalOrders: mockDb.orders.length,
		revenue: mockDb.orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0),
		totalReferrals: mockDb.referrals.length,
		flaggedReferrals: mockDb.referrals.filter(r => r.flagged).length
	}
})
