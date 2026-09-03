// server/utils/prisma.ts
// Singleton PrismaClient for the real database. Nitro auto-imports
// everything exported here, same as mockDb.ts - routes that have been
// migrated import `prisma` and query the real SQLite (later Postgres)
// database instead of the in-memory store.
//
// Stashed on globalThis so Nitro's dev-mode module reloads (HMR) reuse
// one connection instead of opening a new one per file save, which
// would otherwise exhaust SQLite's connection handling in dev.

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (import.meta.dev) {
	globalForPrisma.prisma = prisma
}

// Mirrors server/utils/mockDb.ts's recordAuditLog() but writes to the real
// AuditLogEntry table. During the mock -> Prisma route migration, some
// modules write here and some write to the mock store's audit array -
// server/api/admin/audit-log/index.get.ts merges both so nothing is lost
// in between (see DIARY.md for the migration plan).
export function recordAuditLogDb(actorUserId: string, action: string, entityType: string, entityId: string) {
	return prisma.auditLogEntry.create({ data: { actorUserId, action, entityType, entityId } })
}
