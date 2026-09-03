// server/api/admin/huds/index.post.ts
// Create a HUD with its basic fields. Situations/screens/pop-ups start
// empty - they're added on the detail/edit page (app/pages/admin/huds/[id].vue).

import type { Hud } from '../../../../app/types/admin'

export default defineEventHandler(async (event) => {
	const body = await readBody<{ title?: string, description?: string, price?: number, categoryId?: string }>(event)

	if (!body?.title?.trim()) {
		throw createError({ statusCode: 400, statusMessage: 'title is required' })
	}
	if (!body.categoryId || !findById(mockDb.categories, body.categoryId)) {
		throw createError({ statusCode: 400, statusMessage: 'A valid categoryId is required' })
	}

	const now = new Date().toISOString()
	const slug = body.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

	const hud: Hud = {
		id: generateId('hud'),
		title: body.title.trim(),
		slug,
		description: body.description?.trim() ?? '',
		price: body.price ?? 0,
		categoryId: body.categoryId,
		status: 'draft',
		situations: [],
		createdAt: now,
		updatedAt: now
	}

	createItem(mockDb.huds, hud)
	recordAuditLog('admin_1', 'create', 'hud', hud.id)

	return hud
})
