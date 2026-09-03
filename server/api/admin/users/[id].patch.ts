// server/api/admin/users/[id].patch.ts
// Update a customer's editable fields, including the ban/unban toggle
// (status). Backed by the real database.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<{ name?: string, email?: string, status?: 'active' | 'banned' }>(event)

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	let updated
	try {
		updated = await prisma.customer.update({ where: { id }, data: body })
	} catch (error: any) {
		if (error.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'User not found' })
		if (error.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'A user with this email already exists' })
		throw error
	}

	await recordAuditLog('admin_1', body.status ? `set-status:${body.status}` : 'update', 'customer', id)
	return updated
})
