// server/api/admin/users/index.get.ts
// List customers, newest first. Resolves each customer's referrer name
// (referredByUserId) so the admin table can show who referred whom without
// a second lookup on the client - a small taste of the referral tree that
// the dedicated Referrals module (Phase 2) will build out properly.

export default defineEventHandler(async () => {
	const items = [...mockDb.customers]
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
		.map(customer => ({
			...customer,
			referredByName: customer.referredByUserId
				? (mockDb.customers.find(c => c.id === customer.referredByUserId)?.name ?? null)
				: null
		}))

	return { items, total: items.length }
})
