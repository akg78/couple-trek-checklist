import { trekkingChecklist } from '~/data/trekking-checklist'

export const TREK_CATEGORIES = trekkingChecklist.map(group => group.category)

const POLL_MS = 5000
const LOCAL_CHECKLIST_KEY = 'couple-trek-checklist-v3'

const sortItems = (list) =>
  list.sort((a, b) => a.created_at.localeCompare(b.created_at))

const normalizeItems = (list) => {
  for (const item of list) {
    item.owner = normalizeOwnerLabel(item.owner)
    item.packedBy = normalizePackedBy(item)
    item.done = syncDoneFromPackedBy(item.packedBy)
  }
  return sortItems(list)
}

const makeSeedItems = () => {
  const now = Date.now()
  let index = 0
  const rows = []
  for (const group of trekkingChecklist) {
    for (const name of group.items) {
      rows.push({
        id: crypto.randomUUID(),
        category: group.category,
        name,
        owner: DEFAULT_OWNER,
        packedBy: emptyPackedBy(),
        done: false,
        created_at: new Date(now + index).toISOString()
      })
      index += 1
    }
  }
  return rows
}

function getActiveUserId() {
  if (!import.meta.client) return null
  return (
    localStorage.getItem(USER_STORAGE_KEY) ||
    sessionStorage.getItem(USER_STORAGE_KEY)
  )
}

function readLocalSnapshot() {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(LOCAL_CHECKLIST_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!Array.isArray(data.items) || !data.items.length) return null
    return {
      revision: Number(data.revision) || 0,
      items: normalizeItems([...data.items])
    }
  } catch {
    return null
  }
}

function writeLocalSnapshot(rev, list) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(
      LOCAL_CHECKLIST_KEY,
      JSON.stringify({
        revision: Number(rev) || 0,
        items: list
      })
    )
  } catch (error) {
    console.error(error)
  }
}

export function useTrekChecklist() {
  const items = ref([])
  const hydrated = ref(false)
  const revision = ref(0)
  const pushing = ref(false)
  let pollTimer = null
  let pushTimer = null
  let visibilityHandler = null
  let applyingRemote = false

  const applyRemote = (data) => {
    if (!data || !Array.isArray(data.items)) return
    const remoteRev = Number(data.revision) || 0
    if (remoteRev <= revision.value) return
    applyingRemote = true
    revision.value = remoteRev
    items.value = normalizeItems([...data.items])
    writeLocalSnapshot(revision.value, items.value)
    applyingRemote = false
  }

  const pushToServer = async ({ initial = false } = {}) => {
    if (applyingRemote || (!hydrated.value && !initial)) return
    pushing.value = true
    try {
      const data = await $fetch('/api/checklist', {
        method: 'PUT',
        body: { items: items.value }
      })
      revision.value = data.revision
      writeLocalSnapshot(revision.value, items.value)
    } catch (error) {
      console.error(error)
    } finally {
      pushing.value = false
    }
  }

  const schedulePush = () => {
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(() => pushToServer(), 400)
  }

  const pullFromServer = async () => {
    try {
      const data = await $fetch('/api/checklist')
      applyRemote(data)
    } catch (error) {
      console.error(error)
    }
  }

  const tickPoll = () => {
    if (import.meta.client && document.visibilityState === 'hidden') return
    if (!pushing.value) pullFromServer()
  }

  const startLiveSync = () => {
    stopLiveSync()
    pollTimer = setInterval(tickPoll, POLL_MS)

    if (import.meta.client) {
      visibilityHandler = () => {
        if (document.visibilityState === 'visible') pullFromServer()
      }
      document.addEventListener('visibilitychange', visibilityHandler)
    }
  }

  const stopLiveSync = () => {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = null
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = null
    if (import.meta.client && visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }
  }

  const load = async () => {
    hydrated.value = false
    const local = readLocalSnapshot()
    let server = null

    try {
      server = await $fetch('/api/checklist')
    } catch (error) {
      console.error(error)
    }

    const serverRev = Number(server?.revision) || 0
    const serverItems =
      server?.items?.length ? normalizeItems([...server.items]) : null
    const localRev = local?.revision ?? 0
    const localItems = local?.items ?? null

    if (serverItems && serverRev >= localRev) {
      revision.value = serverRev
      items.value = serverItems
    } else if (localItems?.length) {
      revision.value = localRev
      items.value = localItems
      if (!serverItems || localRev > serverRev) {
        await pushToServer({ initial: true })
      }
    } else if (serverItems) {
      revision.value = serverRev
      items.value = serverItems
    } else {
      items.value = makeSeedItems()
      await pushToServer({ initial: true })
    }

    writeLocalSnapshot(revision.value, items.value)
    hydrated.value = true
    startLiveSync()
  }

  watch(
    items,
    () => {
      if (hydrated.value && !applyingRemote) {
        writeLocalSnapshot(revision.value, items.value)
      }
    },
    { deep: true }
  )

  const addItem = (name, category, owner) => {
    const trimmed = name.trim()
    if (!trimmed) return false
    items.value.push({
      id: crypto.randomUUID(),
      name: trimmed,
      category,
      owner: normalizeOwnerLabel(owner),
      packedBy: emptyPackedBy(),
      done: false,
      created_at: new Date().toISOString()
    })
    sortItems(items.value)
    schedulePush()
    return true
  }

  const toggleItem = (item) => {
    const uid = getActiveUserId()
    if (!uid || (uid !== 'ankit' && uid !== 'baishakhi')) return

    if (!item.packedBy) item.packedBy = emptyPackedBy()
    item.packedBy[uid] = !item.packedBy[uid]
    item.done = syncDoneFromPackedBy(item.packedBy)
    schedulePush()
  }

  const isCheckedByMe = (item) => {
    const uid = getActiveUserId()
    if (!uid || !item.packedBy) return false
    return Boolean(item.packedBy[uid])
  }

  const removeItem = (item) => {
    items.value = items.value.filter(i => i.id !== item.id)
    schedulePush()
  }

  const restoreStarter = async () => {
    items.value = makeSeedItems()
    await pushToServer()
  }

  const exportBackup = async () => {
    const json = JSON.stringify(items.value)
    try {
      await navigator.clipboard.writeText(json)
      alert('Checklist copied.')
    } catch {
      prompt('Copy this checklist:', json)
    }
  }

  const importBackup = async () => {
    const raw = prompt('Paste checklist backup:')
    if (!raw?.trim()) return
    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed) || !parsed.every(i => i.id && i.name)) {
        alert('Invalid backup.')
        return
      }
      items.value = normalizeItems(parsed)
      await pushToServer()
    } catch {
      alert('Could not read backup.')
    }
  }

  onUnmounted(() => stopLiveSync())

  return {
    items,
    hydrated,
    load,
    addItem,
    toggleItem,
    isCheckedByMe,
    removeItem,
    restoreStarter,
    exportBackup,
    importBackup,
    stopLiveSync,
    markLabelForItem,
    packedByLabel
  }
}
