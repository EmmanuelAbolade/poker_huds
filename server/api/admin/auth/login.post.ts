// server/api/admin/auth/login.post.ts
// Mock login endpoint. Checks email/password against a single hardcoded
// seeded admin account and sets a plain (unsigned) session cookie holding
// the user id. This exists to make the login -> protected dashboard ->
// logout flow real and demoable; it is NOT production auth. Replace once
// the client confirms an auth provider (see PROJECTDOC.md section 7, Q2).

// Mock-only credential - documented here, not a secret worth protecting.
const MOCK_PASSWORD = 'admin123'

export default defineEventHandler(async (event) => {
	const body = await readBody<{ email?: string, password?: string }>(event)

	const user = mockDb.adminUsers.find(u => u.email === body?.email)
	if (!user || body?.password !== MOCK_PASSWORD) {
		throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
	}

	setCookie(event, 'admin_session', user.id, {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 8 // 8 hours
	})

	return { user }
})
