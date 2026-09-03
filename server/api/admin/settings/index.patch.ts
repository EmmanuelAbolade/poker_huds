// server/api/admin/settings/index.patch.ts
// Bulk-upserts settings from a flat key -> value map. Backed by the real
// database - see index.get.ts's header comment for why this stays one
// endpoint rather than per-key CRUD.

export default defineEventHandler(async (event) => {
	const body = await readBody<Record<string, string>>(event)

	await prisma.$transaction(
		Object.entries(body ?? {}).map(([key, value]) =>
			prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
		)
	)

	await recordAuditLog('admin_1', 'update', 'settings', Object.keys(body ?? {}).join(','))

	const settings = await prisma.setting.findMany()
	const map: Record<string, string> = {}
	for (const setting of settings) map[setting.key] = setting.value
	return map
})
