<!-- app/components/admin/AdminChartCanvas.vue -->
<!-- Generic Chart.js wrapper - every chart on the redesigned Dashboard/
     Analytics pages (line/area, bar, doughnut) goes through this one
     component rather than a type-specific wrapper per chart, since
     Chart.js already handles all three via one API (type + data +
     options). Chart.js only runs client-side (canvas), so the chart
     draws after hydration - onMounted never fires during SSR, so this
     is a no-op empty canvas on the server, which is fine (no layout
     shift because the wrapping div has a fixed height set by the caller). -->
<script setup lang="ts">
import { Chart, registerables, type ChartConfiguration } from 'chart.js'

Chart.register(...registerables)

const props = defineProps<{
	type: 'line' | 'bar' | 'doughnut'
	data: ChartConfiguration['data']
	options?: ChartConfiguration['options']
}>()

const canvasEl = ref<HTMLCanvasElement>()
let chart: Chart | null = null

onMounted(() => {
	if (!canvasEl.value) return
	chart = new Chart(canvasEl.value, {
		type: props.type,
		data: props.data,
		options: { responsive: true, maintainAspectRatio: false, ...props.options }
	})
})

watch(() => props.data, (newData) => {
	if (!chart) return
	chart.data = newData
	chart.update()
}, { deep: true })

// Re-applies on e.g. a light/dark toggle, since callers build `options`
// from useChartTheme()'s reactive colors.
watch(() => props.options, (newOptions) => {
	if (!chart) return
	chart.options = { responsive: true, maintainAspectRatio: false, ...newOptions } as typeof chart.options
	chart.update()
}, { deep: true })

onBeforeUnmount(() => {
	chart?.destroy()
	chart = null
})
</script>

<template>
	<canvas ref="canvasEl" />
</template>
