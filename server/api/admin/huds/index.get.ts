// server/api/admin/huds/index.get.ts
// List HUDs with category name and situation count resolved in. Uses
// _count instead of including the full nested tree - the list view only
// needs the count, and fetching every situation/screen/popup for every
// HUD just to show a number would be wasteful (the full tree is what
// [id].get.ts is for). Backed by the real database.

export default defineEventHandler(async () => {
	const huds = await prisma.hud.findMany({
		orderBy: { updatedAt: 'desc' },
		include: { category: true, _count: { select: { situations: true } } }
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
		situationsCount: h._count.situations,
		createdAt: h.createdAt.toISOString(),
		updatedAt: h.updatedAt.toISOString()
	}))

	return { items, total: items.length }
})
