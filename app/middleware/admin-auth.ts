// app/middleware/admin-auth.ts
// Route middleware guarding /admin/*. Applied per-page via
// definePageMeta({ middleware: 'admin-auth' }) - every admin page except
// login.vue uses it. Redirects to the login page when there's no session.

export default defineNuxtRouteMiddleware(async () => {
	const { fetchSession } = useAdminAuth()
	const user = await fetchSession()

	if (!user) {
		return navigateTo('/admin/login')
	}
})
