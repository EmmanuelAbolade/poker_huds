// app/composables/useAdminAuth.ts
// Client-facing wrapper around the mock auth endpoints
// (server/api/admin/auth/*). Holds the current admin user in shared state
// so the layout/topbar and route middleware all see the same session.

import type { AdminUser } from '~/types/admin'

export function useAdminAuth() {
	const user = useState<AdminUser | null>('admin-user', () => null)

	async function fetchSession() {
		const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
		const { data } = await useFetch('/api/admin/auth/session', { headers })
		user.value = data.value?.user ?? null
		return user.value
	}

	async function login(email: string, password: string) {
		const result = await $fetch('/api/admin/auth/login', {
			method: 'POST',
			body: { email, password }
		})
		user.value = result.user
		return result.user
	}

	async function logout() {
		await $fetch('/api/admin/auth/logout', { method: 'POST' })
		user.value = null
	}

	return { user, fetchSession, login, logout }
}
