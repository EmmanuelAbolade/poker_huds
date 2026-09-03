// server/api/admin/categories/index.post.ts
// Create a category. `slug` is derived from `name` if not provided.
// Backed by the real database - see index.get.ts's header comment.

export default defineEventHandler(async (event) => {
	const body = await readBody<{ name?: string, sortOrder?: number }>(event)

	if (!body?.name?.trim()) {
		throw createError({ statusCode: 400, statusMessage: 'name is required' })
	}

	const slug = body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

	const sortOrder = body.sortOrder ?? (await prisma.category.count()) + 1

	let category
	try {
		category = await prisma.category.create({
			data: { name: body.name.trim(), slug, sortOrder }
		})
	} catch (error: any) {
		if (error.code === 'P2002') {
			throw createError({ statusCode: 409, statusMessage: 'A category with this name already exists' })
		}
		throw error
	}

	await recordAuditLog('admin_1', 'create', 'category', category.id)

	return category
})
