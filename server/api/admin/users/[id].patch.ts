// server/api/admin/users/[id].patch.ts
// Update a customer's editable fields, including the ban/unban toggle
// (status). Real password reset needs real auth (see PROJECTDOC.md
// section 7, Q2) - not implemented here.

import type { Customer } from '../../../../app/types/admin'

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readBody<Partial<Pick<Customer, 'name' | 'email' | 'status'>>>(event)

	if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

	const updated = updateItem<Customer>(mockDb.customers, id, body)
	if (!updated) throw createError({ statusCode: 404, statusMessage: 'User not found' })

	recordAuditLog('admin_1', body.status ? `set-status:${body.status}` : 'update', 'customer', id)
	return updated
})
