// server/api/admin/referrals/index.get.ts
// List referral records with referrer/referred names resolved in, for
// both the flat table and the referrer-grouped tree summary on the page.

export default defineEventHandler(async () => {
	const items = [...mockDb.referrals]
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
		.map(referral => ({
			...referral,
			referrerName: mockDb.customers.find(c => c.id === referral.referrerUserId)?.name ?? 'Unknown user',
			referredName: mockDb.customers.find(c => c.id === referral.referredUserId)?.name ?? 'Unknown user'
		}))

	return { items, total: items.length }
})
