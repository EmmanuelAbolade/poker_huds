<!-- app/layouts/admin.vue -->
<!-- Shell for every /admin/* page: sidebar nav (all modules from
     PROJECTDOC.md section 3.2, including the ones still placeholders),
     topbar with light/dark toggle + logged-in user, and a content slot.
     Not used by the storefront (see app/layouts/default.vue). -->
<script setup lang="ts">
const { user, logout } = useAdminAuth()
const route = useRoute()

const navGroups = [
	{
		label: 'Overview',
		items: [
			{ to: '/admin', label: 'Dashboard', icon: 'material-symbols:dashboard-outline' }
		]
	},
	{
		label: 'Catalog',
		items: [
			{ to: '/admin/huds', label: 'HUD Products', icon: 'material-symbols:widgets-outline' },
			{ to: '/admin/categories', label: 'Categories', icon: 'material-symbols:category-outline' },
			{ to: '/admin/media', label: 'Media', icon: 'material-symbols:perm-media-outline' }
		]
	},
	{
		label: 'Customers',
		items: [
			{ to: '/admin/users', label: 'Users', icon: 'material-symbols:group-outline' },
			{ to: '/admin/orders', label: 'Orders & Licenses', icon: 'material-symbols:receipt-long-outline' },
			{ to: '/admin/referrals', label: 'Referrals', icon: 'material-symbols:hub-outline' }
		]
	},
	{
		label: 'System',
		items: [
			{ to: '/admin/analytics', label: 'Analytics', icon: 'material-symbols:monitoring' },
			{ to: '/admin/audit-log', label: 'Audit Log', icon: 'material-symbols:history' },
			{ to: '/admin/settings', label: 'Settings', icon: 'material-symbols:settings-outline' }
		]
	}
]

function isActive(to: string) {
	return to === '/admin' ? route.path === '/admin' : route.path.startsWith(to)
}

async function onLogout() {
	await logout()
	await navigateTo('/admin/login')
}
</script>

<template>
	<div class="flex min-h-screen bg-default text-default">
		<aside class="w-64 shrink-0 border-r border-default flex flex-col">
			<div class="p-4 border-b border-default">
				<p class="font-semibold">Gamblin4Kids</p>
				<p class="text-xs text-muted">Admin Console</p>
			</div>

			<nav class="flex-1 overflow-y-auto p-3 flex flex-col gap-5">
				<div v-for="group in navGroups" :key="group.label">
					<p class="px-2 mb-1 text-xs font-medium uppercase tracking-wide text-muted">{{ group.label }}</p>
					<ul class="flex flex-col gap-0.5">
						<li v-for="item in group.items" :key="item.to">
							<NuxtLink
								:to="item.to"
								class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
								:class="isActive(item.to)
									? 'bg-elevated text-highlighted font-medium'
									: 'text-toned hover:bg-elevated'"
							>
								<UIcon :name="item.icon" class="size-4 shrink-0" />
								<span>{{ item.label }}</span>
							</NuxtLink>
						</li>
					</ul>
				</div>
			</nav>
		</aside>

		<div class="flex-1 flex flex-col min-w-0">
			<header class="h-14 shrink-0 border-b border-default flex items-center justify-between px-4">
				<p class="text-sm text-muted">Signed in as {{ user?.name }} ({{ user?.role }})</p>
				<div class="flex items-center gap-2">
					<UColorModeButton />
					<UButton size="sm" color="neutral" variant="ghost" icon="material-symbols:logout" @click="onLogout">
						Log out
					</UButton>
				</div>
			</header>

			<main class="flex-1 overflow-y-auto p-6">
				<slot />
			</main>
		</div>
	</div>
</template>
