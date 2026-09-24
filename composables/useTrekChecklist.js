import { trekkingChecklist } from '~/data/trekking-checklist'

const STORAGE_KEY = 'couple-trek-checklist-v2'

export const TREK_CATEGORIES = trekkingChecklist.map(group => group.category)
export const TREK_OWNERS = ['🤝 Shared', '👤 Traveler 1', '👤 Traveler 2']
export const DEFAULT_OWNER = TREK_OWNERS[0]

const normalizeOwner = (owner) => {
  if (owner === '👨 Ankit') return '👤 Traveler 1'
  if (owner === '👩 Baishakhi' || owner === '👩 Partner') return '👤 Traveler 2'
  return owner
}

const sortItems = (list) =>
  list.sort((a, b) => a.created_at.localeCompare(b.created_at))

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
        done: false,
        created_at: new Date(now + index).toISOString()
      })
      index += 1
    }
  }
  return rows
}

const readStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const writeStorage = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useTrekChecklist() {
  const items = ref([])
  const hydrated = ref(false)

  const load = () => {
    const stored = readStorage()
    if (stored?.length) {
      for (const item of stored) item.owner = normalizeOwner(item.owner)
      items.value = sortItems(stored)
      writeStorage(items.value)
    } else {
      items.value = makeSeedItems()
      writeStorage(items.value)
    }
    hydrated.value = true
  }

  const addItem = (name, category, owner) => {
    const trimmed = name.trim()
    if (!trimmed) return false
    items.value.push({
      id: crypto.randomUUID(),
      name: trimmed,
      category,
      owner,
      done: false,
      created_at: new Date().toISOString()
    })
    sortItems(items.value)
    return true
  }

  const toggleItem = (item) => {
    item.done = !item.done
  }

  const removeItem = (item) => {
    items.value = items.value.filter(i => i.id !== item.id)
  }

  const restoreStarter = () => {
    items.value = makeSeedItems()
  }

  const exportBackup = async () => {
    const json = JSON.stringify(items.value)
    try {
      await navigator.clipboard.writeText(json)
      alert('Checklist copied. Send it to your partner to import.')
    } catch {
      prompt('Copy this checklist:', json)
    }
  }

  const importBackup = () => {
    const raw = prompt('Paste checklist backup:')
    if (!raw?.trim()) return
    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed) || !parsed.every(i => i.id && i.name)) {
        alert('Invalid backup.')
        return
      }
      items.value = sortItems(parsed)
    } catch {
      alert('Could not read backup.')
    }
  }

  watch(
    items,
    value => {
      if (hydrated.value) writeStorage(value)
    },
    { deep: true }
  )

  return {
    items,
    hydrated,
    load,
    addItem,
    toggleItem,
    removeItem,
    restoreStarter,
    exportBackup,
    importBackup
  }
}
