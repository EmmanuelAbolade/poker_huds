// app/types/admin.ts
// Shared domain model for the admin console. Every server route and every
// admin page imports its entity shapes from here, never redeclares them -
// this file is the single source of truth for "what does a HUD/User/Order/
// Referral look like". Mirrors the entity list in PROJECTDOC.md section 4.

export type AdminRole = 'super_admin' | 'admin' | 'moderator'

export type UserStatus = 'active' | 'banned'

export interface AdminUser {
	id: string
	email: string
	name: string
	role: AdminRole
	createdAt: string
}

export interface Customer {
	id: string
	email: string
	name: string
	status: UserStatus
	referredByUserId: string | null
	createdAt: string
}

export interface Category {
	id: string
	name: string
	slug: string
	sortOrder: number
}

export type HudStatus = 'draft' | 'published'

export interface PopupImage {
	id: string
	screenId: string
	imageUrl: string
	label: string
}

export interface Screen {
	id: string
	situationId: string
	imageUrl: string
	sortOrder: number
	popups: PopupImage[]
}

export interface Situation {
	id: string
	hudId: string
	title: string
	sortOrder: number
	screens: Screen[]
}

export interface Hud {
	id: string
	title: string
	slug: string
	description: string
	price: number
	categoryId: string
	status: HudStatus
	situations: Situation[]
	createdAt: string
	updatedAt: string
}

export type MediaAssetType = 'image' | 'video'

export interface MediaAsset {
	id: string
	type: MediaAssetType
	url: string
	ownerType: 'hud' | 'situation' | 'screen' | 'popup'
	ownerId: string
	uploadedAt: string
}

export type OrderStatus = 'paid' | 'refunded' | 'pending'

export interface Order {
	id: string
	userId: string
	hudId: string
	amount: number
	status: OrderStatus
	purchasedAt: string
}

export type LicenseStatus = 'active' | 'expired' | 'revoked'

export interface License {
	id: string
	orderId: string
	userId: string
	hudId: string
	issuedAt: string
	expiresAt: string | null
	status: LicenseStatus
}

export type ReferralLevel = 1 | 2

export interface Referral {
	id: string
	referrerUserId: string
	referredUserId: string
	level: ReferralLevel
	earnings: number
	flagged: boolean
	createdAt: string
}

export interface AuditLogEntry {
	id: string
	actorUserId: string
	action: string
	entityType: string
	entityId: string
	createdAt: string
}

export interface Setting {
	key: string
	value: string
	updatedAt: string
}

// Generic paginated list envelope used by every admin list endpoint.
export interface ListResult<T> {
	items: T[]
	total: number
}
