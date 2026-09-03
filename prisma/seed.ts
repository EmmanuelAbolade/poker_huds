// prisma/seed.ts
// Seeds the real SQLite database with the same demo data
// server/utils/mockDb.ts uses, so switching a route from the mock layer
// to Prisma doesn't change what the admin UI shows. Run via
// `npx prisma db seed` (registered in package.json's `prisma.seed` field).

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
	await prisma.auditLogEntry.deleteMany()
	await prisma.referral.deleteMany()
	await prisma.license.deleteMany()
	await prisma.order.deleteMany()
	await prisma.popupImage.deleteMany()
	await prisma.screen.deleteMany()
	await prisma.situation.deleteMany()
	await prisma.hud.deleteMany()
	await prisma.category.deleteMany()
	await prisma.customer.deleteMany()
	await prisma.adminUser.deleteMany()
	await prisma.setting.deleteMany()

	await prisma.adminUser.create({
		data: { id: 'admin_1', email: 'admin@gamblin4kids.local', name: 'Admin', role: 'super_admin' }
	})

	const categories = await Promise.all(
		[
			{ id: 'cat_1', name: 'Cash', slug: 'cash', sortOrder: 1 },
			{ id: 'cat_2', name: 'MTT', slug: 'mtt', sortOrder: 2 },
			{ id: 'cat_3', name: 'Spins', slug: 'spins', sortOrder: 3 },
			{ id: 'cat_4', name: 'PLO', slug: 'plo', sortOrder: 4 },
			{ id: 'cat_5', name: '6+', slug: '6-plus', sortOrder: 5 },
			{ id: 'cat_6', name: 'GTO', slug: 'gto', sortOrder: 6 },
			{ id: 'cat_7', name: 'Software', slug: 'software', sortOrder: 7 },
			{ id: 'cat_8', name: 'Courses', slug: 'courses', sortOrder: 8 }
		].map(data => prisma.category.create({ data }))
	)

	const cashCategory = categories[0]!

	const hud1 = await prisma.hud.create({
		data: {
			id: 'hud_1',
			title: 'Cash Grinder HUD',
			slug: 'cash-grinder-hud',
			description: 'A full stats HUD tuned for 6-max cash games.',
			price: 300,
			categoryId: cashCategory.id,
			status: 'published',
			situations: {
				create: [
					{
						id: 'sit_1',
						title: 'Preflop 3-bet spots',
						sortOrder: 1,
						screens: {
							create: [
								{ id: 'scr_1', imageUrl: '/img/poker_hud_1.png', sortOrder: 1 },
								{
									id: 'scr_2',
									imageUrl: '/img/poker_hud_2.png',
									sortOrder: 2,
									popups: { create: [{ id: 'pop_1', imageUrl: '/img/poker_hud_3.webp', label: 'Detailed stat breakdown' }] }
								}
							]
						}
					}
				]
			}
		}
	})

	await prisma.hud.create({
		data: {
			id: 'hud_2',
			title: 'MTT Late Stage HUD',
			slug: 'mtt-late-stage-hud',
			description: 'Built for ICM-heavy final table decisions.',
			price: 200,
			categoryId: categories[1]!.id,
			status: 'draft'
		}
	})

	// Sequential, not Promise.all - each customer's referredById depends on
	// the previous one already existing (Alice -> Bob -> Cara chain).
	const alice = await prisma.customer.create({ data: { id: 'usr_1', email: 'alice@example.com', name: 'Alice' } })
	await prisma.customer.create({ data: { id: 'usr_2', email: 'bob@example.com', name: 'Bob', referredById: alice.id } })
	await prisma.customer.create({ data: { id: 'usr_3', email: 'cara@example.com', name: 'Cara', referredById: 'usr_2' } })

	const order1 = await prisma.order.create({
		data: { id: 'ord_1', userId: alice.id, hudId: hud1.id, amount: 300, status: 'paid' }
	})

	await prisma.license.create({
		data: { id: 'lic_1', orderId: order1.id, userId: alice.id, hudId: hud1.id }
	})

	await prisma.referral.create({
		data: { id: 'ref_1', referrerUserId: 'usr_1', referredUserId: 'usr_2', level: 1, earnings: 30 }
	})
	await prisma.referral.create({
		data: { id: 'ref_2', referrerUserId: 'usr_1', referredUserId: 'usr_3', level: 2, earnings: 10 }
	})

	await prisma.setting.create({ data: { key: 'site_name', value: 'Gamblin4Kids' } })

	console.log('Seed complete.')
}

main()
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
