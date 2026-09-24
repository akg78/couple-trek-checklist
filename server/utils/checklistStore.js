import { head, put } from '@vercel/blob'

const BLOB_PATH = 'couple-trek/checklist-v1.json'

const memoryStore = globalThis.__trekChecklistStore ??= {
  revision: 0,
  items: []
}

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || null
}

async function readFromBlob() {
  const token = blobToken()
  if (!token) return null

  try {
    const meta = await head(BLOB_PATH, { token })
    const res = await fetch(meta.url)
    if (!res.ok) return { revision: 0, items: [] }
    const data = await res.json()
    return {
      revision: Number(data.revision) || 0,
      items: Array.isArray(data.items) ? data.items : []
    }
  } catch {
    return { revision: 0, items: [] }
  }
}

async function writeToBlob(payload) {
  const token = blobToken()
  if (!token) return false

  await put(BLOB_PATH, JSON.stringify(payload), {
    access: 'public',
    token,
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  })
  return true
}

export async function readChecklist() {
  const fromBlob = await readFromBlob()
  if (fromBlob) return fromBlob

  return {
    revision: memoryStore.revision,
    items: [...memoryStore.items]
  }
}

export async function writeChecklist(items) {
  const current = await readChecklist()
  const payload = {
    revision: current.revision + 1,
    items: Array.isArray(items) ? items : []
  }

  const savedToBlob = await writeToBlob(payload)
  if (savedToBlob) return payload

  memoryStore.revision = payload.revision
  memoryStore.items = payload.items
  return payload
}
