// server/api/admin/categories/[id].patch.ts
// Update a category's editable fields.

import type { Category } from '../../../../app/types/admin'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<Partial<Pick<Category, 'name' | 'slug' | 'sortOrder'>>>(event)

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	const updated = updateItem<Category>(mockDb.categories, id, body)
	if (!updated) throw createError({ statusCode: 404, statusMessage: 'Category not found' })

	recordAuditLog('admin_1', 'update', 'category', id)
	return updated
})
