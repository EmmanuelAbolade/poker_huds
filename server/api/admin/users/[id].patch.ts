// server/api/admin/users/[id].patch.ts
// Update a customer's editable fields, including the ban/unban toggle
// (status). Backed by the real database. Ban/unban is a moderation
// action (moderators can do it); changing name/email is an account edit
// (admin/super_admin only) - see server/utils/permissions.ts.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<{ name?: string, email?: string, status?: 'active' | 'banned' }>(event)
	const isStatusOnlyChange = body.status !== undefined && body.name === undefined && body.email === undefined
	const actor = requireRole(event, isStatusOnlyChange ? ['moderator', 'admin', 'super_admin'] : ['admin', 'super_admin'])

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	let updated
	try {
		updated = await prisma.customer.update({ where: { id }, data: body })
	} catch (error: any) {
		if (error.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'User not found' })
		if (error.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'A user with this email already exists' })
		throw error
	}

	await recordAuditLog(actor.id, body.status ? `set-status:${body.status}` : 'update', 'customer', id)
	return updated
})
