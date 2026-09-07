// server/api/admin/admin-users/index.get.ts
// List staff (console) accounts - distinct from Customer accounts (the
// Users module). super_admin only: this is account/access management,
// not a business entity other roles need visibility into.

export default defineEventHandler(async (event) => {
	requireRole(event, ['super_admin'])

	const items = await prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } })
	return { items, total: items.length }
})
