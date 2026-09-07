// server/utils/storage.ts
// File storage adapter. Local disk today (writes into public/uploads/,
// served directly by Nuxt's static file handling - zero setup, no
// account needed) because no storage provider is confirmed yet
// (PROJECTDOC.md section 6, Q4). Swapping to S3/R2/Supabase Storage
// later means replacing the two functions below - every caller only
// knows about saveFile()/deleteFile(), never the local-disk detail.
//
// NOT production-appropriate as-is: public/ ships with the app bundle,
// so uploads here don't survive a redeploy on most hosts, and nothing
// here does virus scanning, size limits beyond Nitro's body parser
// default, or content-type sniffing. Fine for local dev/demo; flagged
// clearly rather than left as a silent gap.

import { randomUUID } from 'node:crypto'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { join, extname } from 'node:path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

export async function saveFile(buffer: Buffer, originalName: string): Promise<string> {
	await mkdir(UPLOAD_DIR, { recursive: true })
	const filename = `${randomUUID()}${extname(originalName) || ''}`
	await writeFile(join(UPLOAD_DIR, filename), buffer)
	return `/uploads/${filename}`
}

export async function deleteFile(url: string): Promise<void> {
	if (!url.startsWith('/uploads/')) return // not a locally-stored file - nothing to clean up
	const filename = url.replace('/uploads/', '')
	await unlink(join(UPLOAD_DIR, filename)).catch(() => {}) // already gone is not an error
}
