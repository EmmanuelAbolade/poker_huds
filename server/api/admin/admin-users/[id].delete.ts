// server/api/admin/admin-users/[id].delete.ts
// Deletes a staff account. Guards against self-deletion (would end the
// requester's own session mid-request) and against deleting the last
// super_admin (would leave the console un-administrable).

export default defineEventHandler(async (event) => {
	const actor = requireRole(event, ['super_admin'])
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	if (id === actor.id) {
		throw createError({ statusCode: 409, statusMessage: 'Cannot delete your own account' })
	}

	const target = await prisma.adminUser.findUnique({ where: { id } })
	if (target?.role === 'super_admin') {
		const otherSuperAdmins = await prisma.adminUser.count({ where: { role: 'super_admin', id: { not: id } } })
		if (otherSuperAdmins === 0) {
			throw createError({ statusCode: 409, statusMessage: 'Cannot delete the last super_admin' })
		}
	}

	try {
		await prisma.adminUser.delete({ where: { id } })
	} catch (error: any) {
		if (error.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'Admin not found' })
		if (error.code === 'P2003') {
			throw createError({ statusCode: 409, statusMessage: 'Admin has audit log history and cannot be deleted' })
		}
		throw error
	}

	await recordAuditLog(actor.id, 'delete', 'admin_user', id)
	return { ok: true }
})
