// app/app.config.ts
// Global Nuxt UI theme overrides. Adds a "3D"/elevated feel to every
// UButton across the admin console (shadow + hover lift + press-down)
// without editing each of the ~150 button usages individually - Nuxt UI
// merges these into its own defaults rather than replacing them.
// Restricted to solid/soft (the variants actually used as real buttons
// throughout the console) - ghost/link stay flat on purpose, since a
// shadow under a transparent-background button reads as a floating
// rectangle rather than a raised surface.

export default defineAppConfig({
	ui: {
		button: {
			variants: {
				variant: {
					solid: 'shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-150',
					soft: 'shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-150'
				}
			}
		}
	}
})
