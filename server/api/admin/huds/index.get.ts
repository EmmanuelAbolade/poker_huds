// server/api/admin/huds/index.get.ts
// List HUDs with category name, situation count, and screen count
// resolved in for the redesigned list table. Screen count needs summing
// per-situation counts in JS since Prisma's _count can't aggregate two
// relations deep in one query. Backed by the real database.

export default defineEventHandler(async () => {
	const huds = await prisma.hud.findMany({
		orderBy: { updatedAt: 'desc' },
		include: {
			category: true,
			situations: { select: { _count: { select: { screens: true } } } }
		}
	})

	const items = huds.map(h => ({
		id: h.id,
		title: h.title,
		slug: h.slug,
		description: h.description,
		price: h.price,
		status: h.status,
		categoryId: h.categoryId,
		categoryName: h.category.name,
		situationsCount: h.situations.length,
		screensCount: h.situations.reduce((sum, s) => sum + s._count.screens, 0),
		createdAt: h.createdAt.toISOString(),
		updatedAt: h.updatedAt.toISOString()
	}))

	return { items, total: items.length }
})
