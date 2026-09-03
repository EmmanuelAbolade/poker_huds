// server/api/admin/huds/[id].get.ts
// Fetch one HUD with its full nested situations/screens/popups - used by
// the detail/edit page.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	const hud = findById(mockDb.huds, id)
	if (!hud) throw createError({ statusCode: 404, statusMessage: 'HUD not found' })

	return hud
})
