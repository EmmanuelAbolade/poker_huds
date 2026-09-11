// server/types.d.ts
// Augments H3's event context with the AdminUser resolved by
// server/middleware/admin-session.ts, so route handlers get
// autocomplete/type-checking on event.context.adminUser instead of
// treating it as `any`.

import type { AdminUser } from '@prisma/client'

declare module 'h3' {
	interface H3EventContext {
		adminUser?: AdminUser
	}
}

export {}
