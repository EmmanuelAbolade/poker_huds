// server/api/admin/huds/index.get.ts
// List HUDs with their category name resolved in, for the list table.

export default defineEventHandler(async () => {
	const items = [...mockDb.huds]
		.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
		.map(hud => ({
			...hud,
			categoryName: mockDb.categories.find(c => c.id === hud.categoryId)?.name ?? 'Uncategorized'
		}))

	return { items, total: items.length }
})
