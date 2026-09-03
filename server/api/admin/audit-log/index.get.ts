// server/api/admin/audit-log/index.get.ts
// Surfaces the audit trail every admin/** mutation route writes via
// recordAuditLog() (server/utils/prisma.ts). Read-only. Backed
// entirely by the real database now that every module has been migrated
// off the mock data layer (see DIARY.md for the migration story).

export default defineEventHandler(async () => {
	const entries = await prisma.auditLogEntry.findMany({
		orderBy: { createdAt: 'desc' },
		include: { actor: true }
	})

	const items = entries.map(entry => ({
		id: entry.id,
		actorUserId: entry.actorUserId,
		actorName: entry.actor.name,
		action: entry.action,
		entityType: entry.entityType,
		entityId: entry.entityId,
		createdAt: entry.createdAt.toISOString()
	}))

	return { items, total: items.length }
})
