<!-- app/components/admin/AdminBarChart.vue -->
<!-- Minimal horizontal bar chart, plain HTML/CSS (no charting library -
     see DIARY.md for why). One hue per the dataviz skill's "sequential =
     one hue" rule since every use here is a single-series magnitude
     comparison (revenue/orders/earnings), so no legend is needed - the
     chart title names the series. Colors come from Nuxt UI's theme
     tokens (--ui-primary etc.) so bars stay correct in light and dark
     automatically. Values are always shown as text (not just bar length)
     so the data is readable without relying on comparing bar widths, and
     a native title attribute gives a hover tooltip. -->
<script setup lang="ts">
const props = defineProps<{
	items: { label: string, value: number }[]
	valuePrefix?: string
	color?: string
}>()

function widthPct(value: number) {
	const max = Math.max(...props.items.map(i => i.value), 1)
	return `${Math.max((value / max) * 100, 2)}%`
}
</script>

<template>
	<div class="flex flex-col gap-3">
		<div v-for="item in items" :key="item.label" class="flex items-center gap-3">
			<span class="w-32 shrink-0 truncate text-sm text-muted" :title="item.label">{{ item.label }}</span>
			<div class="flex-1 h-3 rounded-full bg-elevated overflow-hidden">
				<div
					class="h-full rounded-full transition-all"
					:style="{ width: widthPct(item.value), background: color ?? 'var(--ui-primary)' }"
					:title="`${valuePrefix ?? ''}${item.value}`"
				/>
			</div>
			<span class="w-16 shrink-0 text-right text-sm font-medium">{{ valuePrefix }}{{ item.value }}</span>
		</div>
		<p v-if="!items.length" class="text-sm text-muted">No data yet.</p>
	</div>
</template>
