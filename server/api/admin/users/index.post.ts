// server/api/admin/users/index.post.ts
// Create a customer account. Backed by the real database - the unique
// email constraint is enforced by the schema (P2002), not app code.

export default defineEventHandler(async (event) => {
	const body = await readBody<{ name?: string, email?: string, referredByUserId?: string | null }>(event)

	if (!body?.name?.trim() || !body?.email?.trim()) {
		throw createError({ statusCode: 400, statusMessage: 'name and email are required' })
	}

	let customer
	try {
		customer = await prisma.customer.create({
			data: {
				name: body.name.trim(),
				email: body.email.trim(),
				referredById: body.referredByUserId || null
			}
		})
	} catch (error: any) {
		if (error.code === 'P2002') {
			throw createError({ statusCode: 409, statusMessage: 'A user with this email already exists' })
		}
		throw error
	}

	await recordAuditLog('admin_1', 'create', 'customer', customer.id)
	return customer
})
