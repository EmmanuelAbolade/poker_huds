// server/api/admin/users/[id].delete.ts
// Deletes a customer. Backed by the real database - if this user has
// orders/licenses/referrals on record, the foreign key correctly blocks
// the delete (P2003) rather than silently orphaning that history.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	try {
		await prisma.customer.delete({ where: { id } })
	} catch (error: any) {
		if (error.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'User not found' })
		if (error.code === 'P2003') {
			throw createError({ statusCode: 409, statusMessage: 'User has orders, licenses, or referrals on record and cannot be deleted' })
		}
		throw error
	}

	await recordAuditLog('admin_1', 'delete', 'customer', id)
	return { ok: true }
})
