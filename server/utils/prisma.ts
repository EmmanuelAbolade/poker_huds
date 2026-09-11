// server/utils/prisma.ts
// Singleton PrismaClient for the app's database (server/utils/mockDb.ts,
// the original in-memory stand-in, is gone now that every admin/** route
// has been migrated to query this instead - see DIARY.md for that story).
// Nitro auto-imports everything exported from server/utils/**, so `prisma`
// and `recordAuditLog` below are available in every route with no import.
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

export function recordAuditLog(actorUserId: string, action: string, entityType: string, entityId: string) {
	return prisma.auditLogEntry.create({ data: { actorUserId, action, entityType, entityId } })
}
