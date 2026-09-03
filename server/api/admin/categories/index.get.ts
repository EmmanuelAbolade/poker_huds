// server/api/admin/categories/index.get.ts
// List all categories, sorted for display order. Backed by the real
// database (prisma/schema.prisma) - the first module cut over from the
// mock data layer, same role Categories played as the reference module
// back in Phase 0 (see DIARY.md).

export default defineEventHandler(async () => {
	const items = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })
	return { items, total: items.length }
})
