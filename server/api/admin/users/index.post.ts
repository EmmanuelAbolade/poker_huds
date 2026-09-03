// server/api/admin/users/index.post.ts
// Create a customer account. Manual creation from the admin console is a
// support/admin convenience - the storefront signup flow (out of scope
// here) will have its own path to the same customers collection later.

import type { Customer } from '../../../../app/types/admin'

export default defineEventHandler(async (event) => {
	const body = await readBody<{ name?: string, email?: string, referredByUserId?: string | null }>(event)

	if (!body?.name?.trim() || !body?.email?.trim()) {
		throw createError({ statusCode: 400, statusMessage: 'name and email are required' })
	}

	if (mockDb.customers.some(c => c.email.toLowerCase() === body.email!.trim().toLowerCase())) {
		throw createError({ statusCode: 409, statusMessage: 'A user with this email already exists' })
	}

	const customer: Customer = {
		id: generateId('usr'),
		name: body.name.trim(),
		email: body.email.trim(),
		status: 'active',
		referredByUserId: body.referredByUserId || null,
		createdAt: new Date().toISOString()
	}

	createItem(mockDb.customers, customer)
	recordAuditLog('admin_1', 'create', 'customer', customer.id)

	return customer
})
