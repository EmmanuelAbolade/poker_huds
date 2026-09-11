// app/composables/useChartTheme.ts
// Chart.js's default grid/tick colors are a fixed gray tuned for light
// backgrounds - legible-ish but dim on a dark background. Per the
// project's dataviz guidance, dark mode is a deliberate second pass, not
// an automatic flip, so this reads Nuxt UI's color mode and returns
// explicit light/dark tick+grid colors every chart's `options` should
// spread in.

export function useChartTheme() {
	const colorMode = useColorMode()
	const isDark = computed(() => colorMode.value === 'dark')

	const textColor = computed(() => (isDark.value ? '#cbd5e1' : '#475569'))
	const gridColor = computed(() => (isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'))

	const baseOptions = computed(() => ({
		color: textColor.value,
		scales: {
			x: { ticks: { color: textColor.value }, grid: { color: gridColor.value } },
			y: { ticks: { color: textColor.value }, grid: { color: gridColor.value } }
		},
		plugins: {
			legend: { labels: { color: textColor.value } }
		}
	}))

	return { isDark, textColor, gridColor, baseOptions }
}
