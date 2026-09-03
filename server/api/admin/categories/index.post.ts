// server/api/admin/categories/index.post.ts
// Create a category. `slug` is derived from `name` if not provided.

import type { Category } from '../../../../app/types/admin'

export default defineEventHandler(async (event) => {
	const body = await readBody<{ name?: string, sortOrder?: number }>(event)

	if (!body?.name?.trim()) {
		throw createError({ statusCode: 400, statusMessage: 'name is required' })
	}

	const slug = body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

	const category: Category = {
		id: generateId('cat'),
		name: body.name.trim(),
		slug,
		sortOrder: body.sortOrder ?? mockDb.categories.length + 1
	}

	createItem(mockDb.categories, category)
	recordAuditLog('admin_1', 'create', 'category', category.id)

	return category
})
