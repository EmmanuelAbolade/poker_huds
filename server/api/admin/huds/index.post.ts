// server/api/admin/huds/index.post.ts
// Create a HUD with its basic fields. Situations/screens/pop-ups start
// empty - added on the detail/edit page. Backed by the real database.

export default defineEventHandler(async (event) => {
	const body = await readBody<{ title?: string, description?: string, price?: number, categoryId?: string }>(event)

	if (!body?.title?.trim()) {
		throw createError({ statusCode: 400, statusMessage: 'title is required' })
	}
	if (!body.categoryId || !(await prisma.category.findUnique({ where: { id: body.categoryId } }))) {
		throw createError({ statusCode: 400, statusMessage: 'A valid categoryId is required' })
	}

	const slug = body.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

	let hud
	try {
		hud = await prisma.hud.create({
			data: {
				title: body.title.trim(),
				slug,
				description: body.description?.trim() ?? '',
				price: body.price ?? 0,
				categoryId: body.categoryId,
				status: 'draft'
			}
		})
	} catch (error: any) {
		if (error.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'A HUD with this title already exists' })
		throw error
	}

	await recordAuditLog('admin_1', 'create', 'hud', hud.id)
	return { ...hud, situations: [] }
})
