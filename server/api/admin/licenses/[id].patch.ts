// server/api/admin/licenses/[id].patch.ts
// Manage a license directly: extend/set expiresAt, revoke, reactivate.
// Backed by the real database.

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<{ status?: 'active' | 'expired' | 'revoked', expiresAt?: string | null }>(event)

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	let updated
	try {
		updated = await prisma.license.update({
			where: { id },
			data: {
				...(body.status !== undefined && { status: body.status }),
				...(body.expiresAt !== undefined && { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null })
			}
		})
	} catch (error: any) {
		if (error.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'License not found' })
		throw error
	}

	await recordAuditLog('admin_1', 'update', 'license', id)
	return updated
})
