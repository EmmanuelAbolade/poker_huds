// server/api/admin/categories/index.get.ts
// List all categories, sorted for display order.

export default defineEventHandler(async () => {
	const items = [...mockDb.categories].sort((a, b) => a.sortOrder - b.sortOrder)
	return { items, total: items.length }
})
