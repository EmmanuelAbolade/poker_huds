// server/api/admin/settings/index.get.ts
// Returns settings as a flat key -> value map (easier for a settings form
// to bind against than an array of { key, value } records).

export default defineEventHandler(async () => {
	const map: Record<string, string> = {}
	for (const setting of mockDb.settings) {
		map[setting.key] = setting.value
	}
	return map
})
