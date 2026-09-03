// server/api/admin/categories/[id].patch.ts
// Update a category's editable fields. Backed by the real database - see
// index.get.ts's header comment.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<{ name?: string, slug?: string, sortOrder?: number }>(event)

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	let updated
	try {
		updated = await prisma.category.update({ where: { id }, data: body })
	} catch (error: any) {
		if (error.code === 'P2025') {
			throw createError({ statusCode: 404, statusMessage: 'Category not found' })
		}
		if (error.code === 'P2002') {
			throw createError({ statusCode: 409, statusMessage: 'A category with this name already exists' })
		}
		throw error
	}

	await recordAuditLog('admin_1', 'update', 'category', id)
	return updated
})
