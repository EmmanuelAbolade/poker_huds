// server/api/admin/huds/[id].patch.ts
// Updates a HUD. Same two calling patterns as before (basic-field-only
// from the list's quick-edit modal, or basic fields + a full `situations`
// tree from the detail page's nested editor) - but now backed by real
// relational tables instead of a JSON-shaped mock object.
//
// The nested editor still sends the whole tree as the source of truth
// (see app/pages/admin/huds/[id].vue), so this does a transactional
// "delete everything under this HUD, then recreate from the payload"
// rather than diffing old vs. new situations/screens/popups - much
// simpler than a diff/upsert, and correct because cascading deletes mean
// wiping the old tree can't orphan anything. Client-provided ids for
// situations/screens/popups are ignored - Prisma assigns real ones on
// recreate, same as it always has for brand-new items.

import type { Hud } from '../../../../app/types/admin'

type SituationInput = {
	title: string
	sortOrder: number
	screens: { imageUrl: string, sortOrder: number, popups: { imageUrl: string, label: string }[] }[]
}

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<Partial<Pick<Hud, 'title' | 'description' | 'price' | 'categoryId' | 'status'>> & { situations?: SituationInput[] }>(event)

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	if (body.categoryId && !(await prisma.category.findUnique({ where: { id: body.categoryId } }))) {
		throw createError({ statusCode: 400, statusMessage: 'A valid categoryId is required' })
	}

	const { situations, ...basicFields } = body

	let updated
	try {
		updated = await prisma.$transaction(async (tx) => {
			if (situations) {
				await tx.situation.deleteMany({ where: { hudId: id } })
				for (const situation of situations) {
					await tx.situation.create({
						data: {
							hudId: id,
							title: situation.title,
							sortOrder: situation.sortOrder,
							screens: {
								create: situation.screens.map(screen => ({
									imageUrl: screen.imageUrl,
									sortOrder: screen.sortOrder,
									popups: { create: screen.popups.map(popup => ({ imageUrl: popup.imageUrl, label: popup.label })) }
								}))
							}
						}
					})
				}
			}

			return tx.hud.update({
				where: { id },
				data: basicFields,
				include: {
					situations: {
						orderBy: { sortOrder: 'asc' },
						include: { screens: { orderBy: { sortOrder: 'asc' }, include: { popups: true } } }
					}
				}
			})
		})
	} catch (error: any) {
		if (error.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'HUD not found' })
		throw error
	}

	await recordAuditLog('admin_1', 'update', 'hud', id)
	return updated
})
