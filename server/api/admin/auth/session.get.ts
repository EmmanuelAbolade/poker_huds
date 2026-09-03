// server/api/admin/auth/session.get.ts
// Resolves the current mock session cookie to an admin user, if any.
// Always returns 200 with { user: AdminUser | null } - callers (the
// admin-auth middleware) decide what to do with a null user, rather than
// this route throwing 401 for what is a normal "not logged in" state.

export default defineEventHandler(async (event) => {
	const sessionUserId = getCookie(event, 'admin_session')
	if (!sessionUserId) return { user: null }

	const user = mockDb.adminUsers.find(u => u.id === sessionUserId) ?? null
	return { user }
})
