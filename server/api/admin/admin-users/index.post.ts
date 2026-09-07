// server/api/admin/admin-users/index.post.ts
// Create a staff account. Logs in with the same mock password every
// admin account uses (see server/api/admin/auth/login.post.ts) - there's
// no per-account credential system yet, just role-gated access.

export default defineEventHandler(async (event) => {
	requireRole(event, ['super_admin'])
	const body = await readBody<{ name?: string, email?: string, role?: 'super_admin' | 'admin' | 'moderator' }>(event)

	if (!body?.name?.trim() || !body?.email?.trim()) {
		throw createError({ statusCode: 400, statusMessage: 'name and email are required' })
	}

	let created
	try {
		created = await prisma.adminUser.create({
			data: {
				name: body.name.trim(),
				email: body.email.trim(),
				role: body.role ?? 'admin'
			}
		})
	} catch (error: any) {
		if (error.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'An admin with this email already exists' })
		throw error
	}

	await recordAuditLog(event.context.adminUser!.id, 'create', 'admin_user', created.id)
	return created
})
