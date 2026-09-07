<!-- app/components/admin/AdminStatCard.vue -->
<!-- Colorful gradient KPI card matching the client's reference mockups
     (doc/IMG_2026090*.jpg) - every dashboard/list page's stat row uses
     this instead of a plain neutral UCard. Fixed vivid colors (not
     theme-derived) are deliberate here - see app/utils/chartColors.ts's
     header comment for why. White text works in both light and dark
     since the card's own background is a solid gradient, independent of
     the page's light/dark neutral background. -->
<script setup lang="ts">
withDefaults(defineProps<{
	label: string
	value: string | number
	icon: string
	color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
	change?: string
}>(), { color: 'blue' })

const gradients: Record<string, string> = {
	blue: 'from-blue-500 to-blue-600',
	green: 'from-emerald-500 to-emerald-600',
	purple: 'from-purple-500 to-purple-600',
	orange: 'from-orange-400 to-orange-500',
	red: 'from-rose-500 to-rose-600'
}
</script>

<template>
	<div class="relative overflow-hidden rounded-xl p-5 text-white bg-gradient-to-br shadow-sm min-w-0" :class="gradients[color]">
		<UIcon :name="icon" class="absolute -right-3 -bottom-3 size-20 opacity-15" />
		<p class="text-sm font-medium opacity-90 relative">{{ label }}</p>
		<div class="flex items-baseline gap-2 mt-1 relative">
			<p class="text-2xl font-bold truncate">{{ value }}</p>
			<span v-if="change" class="text-xs font-medium opacity-90 shrink-0">{{ change }}</span>
		</div>
	</div>
</template>
