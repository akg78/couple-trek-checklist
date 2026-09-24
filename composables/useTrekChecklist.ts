import { trekkingChecklist } from '~/data/trekking-checklist'

export type TrekItem = {
  id: string
  name: string
  category: string
  owner: string
  done: boolean
  created_at: string
}

const STORAGE_KEY = 'couple-trek-checklist-v2'

export const TREK_CATEGORIES = trekkingChecklist.map(group => group.category)
export const TREK_OWNERS = ['🤝 Shared', '👨 Ankit', '👩 Baishakhi'] as const
export const DEFAULT_OWNER = TREK_OWNERS[0]

const sortItems = (list: TrekItem[]) =>
  list.sort((a, b) => a.created_at.localeCompare(b.created_at))

const makeSeedItems = (): TrekItem[] => {
  const now = Date.now()
  let index = 0
  const rows: TrekItem[] = []
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

const readStorage = (): TrekItem[] | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TrekItem[]
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const writeStorage = (items: TrekItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useTrekChecklist() {
  const items = ref<TrekItem[]>([])
  const hydrated = ref(false)

  const load = () => {
    const stored = readStorage()
    items.value = stored?.length ? sortItems(stored) : makeSeedItems()
    if (!stored?.length) writeStorage(items.value)
    hydrated.value = true
  }

  const addItem = (name: string, category: string, owner: string) => {
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

  const toggleItem = (item: TrekItem) => {
    item.done = !item.done
  }

  const removeItem = (item: TrekItem) => {
    items.value = items.value.filter(i => i.id !== item.id)
  }

  const restoreStarter = () => {
    items.value = makeSeedItems()
  }

  const exportBackup = async () => {
    const json = JSON.stringify(items.value)
    try {
      await navigator.clipboard.writeText(json)
      alert('Checklist copied. Paste it in WhatsApp for Baishakhi.')
    } catch {
      prompt('Copy this checklist:', json)
    }
  }

  const importBackup = () => {
    const raw = prompt('Paste checklist backup:')
    if (!raw?.trim()) return
    try {
      const parsed = JSON.parse(raw) as TrekItem[]
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
