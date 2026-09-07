// server/utils/permissions.ts
// Role matrix, since the client's spec says "role-based access control"
// but never defined what each of super_admin/admin/moderator can
// actually do - this is a judgment call, documented here for the client
// to review/adjust (see PROJECTDOC.md section 7 for the note):
//
//   super_admin - everything, including managing other admin accounts
//                 and system Settings.
//   admin       - full CRUD on every business entity (Categories, HUD
//                 Products, Users/customers, Orders/Licenses,
//                 Referrals, Media) - everything except admin-account
//                 management and Settings.
//   moderator   - read everything, plus the specific moderation actions
//                 (ban/unban a user, flag/unflag a referral as abuse) -
//                 cannot create/edit/delete core business records,
//                 cannot touch admin accounts or Settings.
//
// requireRole() is the enforcement point - call it at the top of a
// mutation route with the roles allowed to perform that specific
// action. GET routes are intentionally unrestricted beyond being
// authenticated (every role can view everything).

import type { H3Event } from 'h3'
import type { AdminRole } from '@prisma/client'

export function requireAdmin(event: H3Event) {
	const user = event.context.adminUser
	if (!user) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
	return user
}

export function requireRole(event: H3Event, allowed: AdminRole[]) {
	const user = requireAdmin(event)
	if (!allowed.includes(user.role)) {
		throw createError({ statusCode: 403, statusMessage: `This action requires role: ${allowed.join(' or ')}` })
	}
	return user
}
