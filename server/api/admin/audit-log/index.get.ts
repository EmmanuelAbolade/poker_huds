// server/api/admin/audit-log/index.get.ts
// Surfaces the audit trail every admin/** mutation route already writes
// via recordAuditLog() (server/utils/mockDb.ts). Read-only - the log
// itself isn't editable by design.

export default defineEventHandler(async () => {
	const items = [...mockDb.auditLog]
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
		.map(entry => ({
			...entry,
			actorName: mockDb.adminUsers.find(u => u.id === entry.actorUserId)?.name ?? entry.actorUserId
		}))

	return { items, total: items.length }
})
