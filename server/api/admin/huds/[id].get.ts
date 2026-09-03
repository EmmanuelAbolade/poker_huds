// server/api/admin/huds/[id].get.ts
// Fetch one HUD with its full nested situations/screens/popups tree -
// used by the detail/edit page. Backed by the real database.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	const hud = await prisma.hud.findUnique({
		where: { id },
		include: {
			situations: {
				orderBy: { sortOrder: 'asc' },
				include: {
					screens: {
						orderBy: { sortOrder: 'asc' },
						include: { popups: true }
					}
				}
			}
		}
	})

	if (!hud) throw createError({ statusCode: 404, statusMessage: 'HUD not found' })

	return hud
})
