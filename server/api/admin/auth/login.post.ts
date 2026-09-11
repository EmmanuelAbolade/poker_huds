// server/api/admin/auth/login.post.ts
// Checks email/password against the real AdminUser table and sets a
// plain (unsigned) session cookie holding the user id. The password
// check itself is still a hardcoded mock constant - there's no password
// hash column or real credential system yet. This makes the login ->
// protected dashboard -> logout flow real and demoable; it is NOT
// production auth. Replace once the client confirms an auth provider
// (see PROJECTDOC.md section 7, Q2).

// Mock-only credential - documented here, not a secret worth protecting.
const MOCK_PASSWORD = 'admin123'

export default defineEventHandler(async (event) => {
	const body = await readBody<{ email?: string, password?: string }>(event)

	const user = body?.email ? await prisma.adminUser.findUnique({ where: { email: body.email } }) : null
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
