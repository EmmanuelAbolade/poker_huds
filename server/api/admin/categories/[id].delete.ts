// server/api/admin/categories/[id].delete.ts
// Delete a category. Backed by the real database - see index.get.ts's
// header comment. Real FK constraints now do what the mock version could
// only comment about: deleting a category still referenced by a HUD will
// fail (P2003) rather than silently orphaning that HUD's categoryId.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	try {
		await prisma.category.delete({ where: { id } })
	} catch (error: any) {
		if (error.code === 'P2025') {
			throw createError({ statusCode: 404, statusMessage: 'Category not found' })
		}
		if (error.code === 'P2003') {
			throw createError({ statusCode: 409, statusMessage: 'Category is still in use by one or more HUDs' })
		}
		throw error
	}

	await recordAuditLogDb('admin_1', 'delete', 'category', id)
	return { ok: true }
})
