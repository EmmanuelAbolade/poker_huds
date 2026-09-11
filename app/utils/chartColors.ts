// app/utils/chartColors.ts
// Fixed vivid palette matching the client's reference mockups (doc/
// IMG_2026090*.jpg) - a colorful dashboard identity, not derived from
// the neutral Nuxt UI theme tokens the rest of the admin console uses.
// Used by both AdminStatCard (CSS gradients) and the Chart.js wrappers
// (canvas gradients need a plain hex to build an rgba stop from).

export const chartPalette = {
	blue: '#3b82f6',
	green: '#22c55e',
	purple: '#a855f7',
	orange: '#f97316',
	red: '#ef4444',
	amber: '#f59e0b',
	gray: '#6b7280'
} as const

export type ChartColor = keyof typeof chartPalette

function hexToRgb(hex: string) {
	const n = parseInt(hex.slice(1), 16)
	return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

// Vertical gradient fill for line/area charts - solid-ish near the line,
// fading to transparent at the baseline. Needs the canvas 2D context and
// Chart.js's chartArea (only available after first layout, hence the
// null check callers should handle).
export function verticalGradient(ctx: CanvasRenderingContext2D, top: number, bottom: number, color: string, topAlpha = 0.35) {
	const { r, g, b } = hexToRgb(color)
	const gradient = ctx.createLinearGradient(0, top, 0, bottom)
	gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${topAlpha})`)
	gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
	return gradient
}
