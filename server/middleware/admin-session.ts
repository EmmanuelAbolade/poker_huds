// server/middleware/admin-session.ts
// Runs before every request. Until now, /api/admin/** routes trusted
// whatever they were sent - the admin-auth page middleware (app/
// middleware/admin-auth.ts) only guards browser navigation, so any
// direct request (curl, another script) could call any admin mutation
// with zero session cookie. Found via browser QA on 2026-09-07 (see
// DIARY.md), fixed here: this is the one place that actually verifies
// the session for the API layer, and it's authoritative - the frontend
// checks exist for UX, this is the real gate.
//
// Resolves the session cookie to a real AdminUser and attaches it to
// event.context.adminUser so route handlers can read the real actor's
// id/role instead of a hardcoded 'admin_1', and so requireRole()
// (server/utils/permissions.ts) has something to check against.

const PUBLIC_PATHS = new Set(['/api/admin/auth/login', '/api/admin/auth/session'])

export default defineEventHandler(async (event) => {
	const path = (event.path ?? '').split('?')[0] ?? ''
	if (!path.startsWith('/api/admin/') || PUBLIC_PATHS.has(path)) return

	const sessionUserId = getCookie(event, 'admin_session')
	const adminUser = sessionUserId ? await prisma.adminUser.findUnique({ where: { id: sessionUserId } }) : null

	if (!adminUser) {
		throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
	}

	event.context.adminUser = adminUser
})
