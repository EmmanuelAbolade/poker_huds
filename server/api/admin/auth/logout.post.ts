// server/api/admin/auth/logout.post.ts
// Clears the mock session cookie set by login.post.ts.

export default defineEventHandler(async (event) => {
	deleteCookie(event, 'admin_session', { path: '/' })
	return { ok: true }
})
