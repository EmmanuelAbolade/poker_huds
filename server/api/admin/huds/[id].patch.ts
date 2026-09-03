// server/api/admin/huds/[id].patch.ts
// Updates a HUD. Used two ways by the frontend:
//  1. The list page's quick-edit modal sends basic fields only
//     (title/description/price/categoryId/status).
//  2. The detail page's nested editor sends the whole `situations` tree
//     back as one replace-in-place save, rather than exposing a separate
//     REST endpoint per situation/screen/popup - deliberately simple for
//     a mock data layer (see DIARY.md for the reasoning).
// Either way it's a plain partial merge, so both calls hit this one route.

import type { Hud } from '../../../../app/types/admin'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<Partial<Pick<Hud, 'title' | 'description' | 'price' | 'categoryId' | 'status' | 'situations'>>>(event)

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	if (body.categoryId && !findById(mockDb.categories, body.categoryId)) {
		throw createError({ statusCode: 400, statusMessage: 'A valid categoryId is required' })
	}

	const updated = updateItem<Hud>(mockDb.huds, id, { ...body, updatedAt: new Date().toISOString() })
	if (!updated) throw createError({ statusCode: 404, statusMessage: 'HUD not found' })

	recordAuditLog('admin_1', 'update', 'hud', id)
	return updated
})
