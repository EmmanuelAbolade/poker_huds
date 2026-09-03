// server/api/admin/settings/index.get.ts
// Returns settings as a flat key -> value map. Backed by the real
// database.

export default defineEventHandler(async () => {
	const settings = await prisma.setting.findMany()
	const map: Record<string, string> = {}
	for (const setting of settings) map[setting.key] = setting.value
	return map
})
