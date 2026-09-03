// server/utils/mockDb.ts
// In-memory data store standing in for a real database (see PROJECTDOC.md
// section 5.3/5.4 - no DB/auth/storage provider has been confirmed by the
// client yet). Every server/api/admin/** route reads and writes only through
// the functions in this file, so swapping in a real database later means
// changing this one file, not every route handler.
//
// State lives in a module-level singleton and resets on server restart -
// fine for demoing the admin console, not for production use.

import type {
	AdminUser, Customer, Category, Hud, Order, License, Referral,
	AuditLogEntry, Setting
} from '../../app/types/admin'

interface Store {
	adminUsers: AdminUser[]
	customers: Customer[]
	categories: Category[]
	huds: Hud[]
	orders: Order[]
	licenses: License[]
	referrals: Referral[]
	auditLog: AuditLogEntry[]
	settings: Setting[]
}

let nextId = 1000
export function generateId(prefix: string): string {
	nextId += 1
	return `${prefix}_${nextId}`
}

function seed(): Store {
	const now = new Date().toISOString()

	const categories: Category[] = [
		{ id: 'cat_1', name: 'Cash', slug: 'cash', sortOrder: 1 },
		{ id: 'cat_2', name: 'MTT', slug: 'mtt', sortOrder: 2 },
		{ id: 'cat_3', name: 'Spins', slug: 'spins', sortOrder: 3 },
		{ id: 'cat_4', name: 'PLO', slug: 'plo', sortOrder: 4 },
		{ id: 'cat_5', name: '6+', slug: '6-plus', sortOrder: 5 },
		{ id: 'cat_6', name: 'GTO', slug: 'gto', sortOrder: 6 },
		{ id: 'cat_7', name: 'Software', slug: 'software', sortOrder: 7 },
		{ id: 'cat_8', name: 'Courses', slug: 'courses', sortOrder: 8 }
	]

	const huds: Hud[] = [
		{
			id: 'hud_1',
			title: 'Cash Grinder HUD',
			slug: 'cash-grinder-hud',
			description: 'A full stats HUD tuned for 6-max cash games.',
			price: 300,
			categoryId: 'cat_1',
			status: 'published',
			situations: [
				{
					id: 'sit_1',
					hudId: 'hud_1',
					title: 'Preflop 3-bet spots',
					sortOrder: 1,
					screens: [
						{ id: 'scr_1', situationId: 'sit_1', imageUrl: '/img/poker_hud_1.png', sortOrder: 1, popups: [] },
						{ id: 'scr_2', situationId: 'sit_1', imageUrl: '/img/poker_hud_2.png', sortOrder: 2, popups: [
							{ id: 'pop_1', screenId: 'scr_2', imageUrl: '/img/poker_hud_3.webp', label: 'Detailed stat breakdown' }
						] }
					]
				}
			],
			createdAt: now,
			updatedAt: now
		},
		{
			id: 'hud_2',
			title: 'MTT Late Stage HUD',
			slug: 'mtt-late-stage-hud',
			description: 'Built for ICM-heavy final table decisions.',
			price: 200,
			categoryId: 'cat_2',
			status: 'draft',
			situations: [],
			createdAt: now,
			updatedAt: now
		}
	]

	const customers: Customer[] = [
		{ id: 'usr_1', email: 'alice@example.com', name: 'Alice', status: 'active', referredByUserId: null, createdAt: now },
		{ id: 'usr_2', email: 'bob@example.com', name: 'Bob', status: 'active', referredByUserId: 'usr_1', createdAt: now },
		{ id: 'usr_3', email: 'cara@example.com', name: 'Cara', status: 'active', referredByUserId: 'usr_2', createdAt: now }
	]

	const orders: Order[] = [
		{ id: 'ord_1', userId: 'usr_1', hudId: 'hud_1', amount: 300, status: 'paid', purchasedAt: now }
	]

	const licenses: License[] = [
		{ id: 'lic_1', orderId: 'ord_1', userId: 'usr_1', hudId: 'hud_1', issuedAt: now, expiresAt: null, status: 'active' }
	]

	const referrals: Referral[] = [
		{ id: 'ref_1', referrerUserId: 'usr_1', referredUserId: 'usr_2', level: 1, earnings: 30, flagged: false, createdAt: now },
		{ id: 'ref_2', referrerUserId: 'usr_1', referredUserId: 'usr_3', level: 2, earnings: 10, flagged: false, createdAt: now }
	]

	return {
		adminUsers: [
			{ id: 'admin_1', email: 'admin@gamblin4kids.local', name: 'Admin', role: 'super_admin', createdAt: now }
		],
		customers,
		categories,
		huds,
		orders,
		licenses,
		referrals,
		auditLog: [],
		settings: [
			{ key: 'site_name', value: 'Gamblin4Kids', updatedAt: now }
		]
	}
}

const store: Store = seed()

// Generic helpers - every collection is an array of objects with a string `id`.
export function listAll<T>(collection: T[]): T[] {
	return collection
}

export function findById<T extends { id: string }>(collection: T[], id: string): T | undefined {
	return collection.find(item => item.id === id)
}

export function createItem<T extends { id: string }>(collection: T[], item: T): T {
	collection.push(item)
	return item
}

export function updateItem<T extends { id: string }>(collection: T[], id: string, patch: Partial<T>): T | null {
	const index = collection.findIndex(item => item.id === id)
	if (index === -1) return null
	const merged = { ...collection[index], ...patch } as T
	collection[index] = merged
	return merged
}

export function removeItem<T extends { id: string }>(collection: T[], id: string): boolean {
	const index = collection.findIndex(item => item.id === id)
	if (index === -1) return false
	collection.splice(index, 1)
	return true
}

export function recordAuditLog(actorUserId: string, action: string, entityType: string, entityId: string) {
	store.auditLog.push({
		id: generateId('audit'),
		actorUserId,
		action,
		entityType,
		entityId,
		createdAt: new Date().toISOString()
	})
}

export const mockDb = store
