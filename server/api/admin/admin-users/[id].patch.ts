// server/api/admin/admin-users/[id].patch.ts
// Update a staff account's name/role. Guards against demoting the last
// super_admin (would lock everyone out of account/settings management).

export default defineEventHandler(async (event) => {
	const actor = requireRole(event, ['super_admin'])
	const id = getRouterParam(event, 'id')
	const body = await readBody<{ name?: string, role?: 'super_admin' | 'admin' | 'moderator' }>(event)

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	if (body.role && body.role !== 'super_admin') {
		const target = await prisma.adminUser.findUnique({ where: { id } })
		if (target?.role === 'super_admin') {
			const otherSuperAdmins = await prisma.adminUser.count({ where: { role: 'super_admin', id: { not: id } } })
			if (otherSuperAdmins === 0) {
				throw createError({ statusCode: 409, statusMessage: 'Cannot demote the last super_admin' })
			}
		}
	}

	let updated
	try {
		updated = await prisma.adminUser.update({ where: { id }, data: body })
	} catch (error: any) {
		if (error.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'Admin not found' })
		throw error
	}

	await recordAuditLog(actor.id, 'update', 'admin_user', id)
	return updated
})
