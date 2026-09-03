// server/api/admin/settings/index.patch.ts
// Bulk-upserts settings from a flat key -> value map - the Settings page
// is one form with a single Save button, not a row-by-row CRUD table, so
// one endpoint that merges everything in is the right shape here (unlike
// Categories/Users/etc. which are genuinely separate records).

export default defineEventHandler(async (event) => {
	const body = await readBody<Record<string, string>>(event)
	const now = new Date().toISOString()

	for (const [key, value] of Object.entries(body ?? {})) {
		const existing = mockDb.settings.find(s => s.key === key)
		if (existing) {
			existing.value = value
			existing.updatedAt = now
		} else {
			mockDb.settings.push({ key, value, updatedAt: now })
		}
	}

	recordAuditLog('admin_1', 'update', 'settings', Object.keys(body ?? {}).join(','))

	const map: Record<string, string> = {}
	for (const setting of mockDb.settings) map[setting.key] = setting.value
	return map
})
