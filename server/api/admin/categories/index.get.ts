// server/api/admin/categories/index.get.ts
// List all categories with HUD count, sorted for display order.

export default defineEventHandler(async () => {
	const categories = await prisma.category.findMany({
		orderBy: { sortOrder: 'asc' },
		include: { _count: { select: { huds: true } } }
	})

	const items = categories.map(c => ({
		id: c.id,
		name: c.name,
		slug: c.slug,
		sortOrder: c.sortOrder,
		description: c.description,
		status: c.status,
		createdAt: c.createdAt.toISOString(),
		hudCount: c._count.huds
	}))

	return { items, total: items.length }
})
