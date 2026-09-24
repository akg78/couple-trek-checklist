import { trekkingChecklist } from '~/data/trekking-checklist'

export const TREK_CATEGORIES = trekkingChecklist.map(group => group.category)

const POLL_MS = 2500

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
  return sessionStorage.getItem(USER_STORAGE_KEY)
}

export function useTrekChecklist() {
  const items = ref([])
  const hydrated = ref(false)
  const revision = ref(0)
  const pushing = ref(false)
  let pollTimer = null
  let pushTimer = null
  let applyingRemote = false

  const applyRemote = (data) => {
    if (!data || !Array.isArray(data.items)) return
    if (data.revision === revision.value) return
    applyingRemote = true
    revision.value = data.revision
    items.value = normalizeItems([...data.items])
    applyingRemote = false
  }

  const pushToServer = async () => {
    if (applyingRemote || !hydrated.value) return
    pushing.value = true
    try {
      const data = await $fetch('/api/checklist', {
        method: 'PUT',
        body: { items: items.value }
      })
      revision.value = data.revision
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

  const startLiveSync = () => {
    stopLiveSync()
    pollTimer = setInterval(() => {
      if (!pushing.value) pullFromServer()
    }, POLL_MS)
  }

  const stopLiveSync = () => {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = null
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = null
  }

  const load = async () => {
    hydrated.value = false
    try {
      const data = await $fetch('/api/checklist')
      if (data.items?.length) {
        revision.value = data.revision
        items.value = normalizeItems(data.items)
      } else {
        items.value = makeSeedItems()
        await pushToServer()
      }
    } catch {
      items.value = makeSeedItems()
    }
    hydrated.value = true
    startLiveSync()
  }

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
