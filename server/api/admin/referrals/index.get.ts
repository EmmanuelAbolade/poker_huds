// server/api/admin/referrals/index.get.ts
// List referral records with referrer/referred names joined in. Backed
// by the real database.

export default defineEventHandler(async () => {
	const referrals = await prisma.referral.findMany({
		orderBy: { createdAt: 'desc' },
		include: { referrer: true, referred: true }
	})

	const items = referrals.map(r => ({
		id: r.id,
		referrerUserId: r.referrerUserId,
		referredUserId: r.referredUserId,
		level: r.level,
		earnings: r.earnings,
		flagged: r.flagged,
		createdAt: r.createdAt.toISOString(),
		referrerName: r.referrer.name,
		referredName: r.referred.name
	}))

	return { items, total: items.length }
})
