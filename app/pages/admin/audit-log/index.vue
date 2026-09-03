<!-- app/pages/admin/audit-log/index.vue -->
<!-- Read-only view of server/api/admin/audit-log - every create/update/
     delete/refund/etc. across every module has been writing here since
     Phase 0 (recordAuditLog() in server/utils/mockDb.ts); this page just
     surfaces it. Closes the "Logs and audit trails" line from the
     client's System Management requirements. -->
<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

type AuditRow = {
	id: string
	actorName: string
	action: string
	entityType: string
	entityId: string
	createdAt: string
}

const { data, status } = await useFetch<{ items: AuditRow[] }>('/api/admin/audit-log')

const UBadge = resolveComponent('UBadge')

const columns: TableColumn<AuditRow>[] = [
	{
		accessorKey: 'createdAt',
		header: 'When',
		cell: ({ row }) => new Date(row.original.createdAt).toLocaleString()
	},
	{ accessorKey: 'actorName', header: 'Actor' },
	{
		accessorKey: 'action',
		header: 'Action',
		cell: ({ row }) => h(UBadge, { color: 'neutral', variant: 'subtle' }, () => row.original.action)
	},
	{ accessorKey: 'entityType', header: 'Entity' },
	{ accessorKey: 'entityId', header: 'Entity ID' }
]
</script>

<template>
	<div class="flex flex-col gap-4">
		<div>
			<h1 class="text-xl font-semibold">Audit Log</h1>
			<p class="text-sm text-muted">Every admin create/update/delete action, recorded automatically. Read-only.</p>
		</div>

		<UTable :data="data?.items ?? []" :columns="columns" :loading="status === 'pending'" />
		<UAlert v-if="!data?.items?.length && status !== 'pending'" color="neutral" variant="soft" title="No audit entries yet" description="Entries appear as soon as you create/edit/delete anything in the admin console." />
	</div>
</template>
