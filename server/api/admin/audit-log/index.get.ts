// server/api/admin/audit-log/index.get.ts
// Surfaces the audit trail. Merges two sources during the mock -> Prisma
// route migration (see DIARY.md): modules already cut over to the real
// database write to prisma.auditLogEntry (via recordAuditLogDb), modules
// still on the mock layer write to mockDb.auditLog (via recordAuditLog).
// Once every route is migrated, the mockDb.auditLog half of this goes away.

export default defineEventHandler(async () => {
	const dbEntries = await prisma.auditLogEntry.findMany({ include: { actor: true } })

	const fromDb = dbEntries.map(entry => ({
		id: entry.id,
		actorUserId: entry.actorUserId,
		actorName: entry.actor.name,
		action: entry.action,
		entityType: entry.entityType,
		entityId: entry.entityId,
		createdAt: entry.createdAt.toISOString()
	}))

	const fromMock = mockDb.auditLog.map(entry => ({
		...entry,
		actorName: mockDb.adminUsers.find(u => u.id === entry.actorUserId)?.name ?? entry.actorUserId
	}))

	const items = [...fromDb, ...fromMock].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

	return { items, total: items.length }
})
