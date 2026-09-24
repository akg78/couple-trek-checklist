export const USER_STORAGE_KEY = 'trek-checklist-user'

export const TREK_USER_OPTIONS = [
  { id: 'ankit', label: '👨 Ankit' },
  { id: 'baishakhi', label: '👩 Baishakhi' }
]

export const TREK_OWNERS = ['🤝 Shared', '👨 Ankit', '👩 Baishakhi']
export const DEFAULT_OWNER = TREK_OWNERS[0]

export function emptyPackedBy() {
  return { ankit: false, baishakhi: false }
}

export function syncDoneFromPackedBy(packedBy) {
  if (!packedBy) return false
  return Boolean(packedBy.ankit || packedBy.baishakhi)
}

export function packedByLabel(packedBy) {
  if (!packedBy) return null
  if (packedBy.ankit && packedBy.baishakhi) return '🤝 Shared'
  if (packedBy.ankit) return '👨 Ankit'
  if (packedBy.baishakhi) return '👩 Baishakhi'
  return null
}

export function markLabelForItem(item) {
  return packedByLabel(item.packedBy) || item.owner
}

export function userIdToLabel(userId) {
  return TREK_USER_OPTIONS.find(u => u.id === userId)?.label ?? ''
}

export function normalizeOwnerLabel(owner) {
  if (owner === '👤 Traveler 1') return '👨 Ankit'
  if (owner === '👤 Traveler 2' || owner === '👩 Partner') return '👩 Baishakhi'
  return owner
}

export function normalizePackedBy(item) {
  if (item.packedBy && typeof item.packedBy === 'object') {
    return {
      ankit: Boolean(item.packedBy.ankit),
      baishakhi: Boolean(item.packedBy.baishakhi)
    }
  }
  const packedBy = emptyPackedBy()
  if (item.done) {
    packedBy.ankit = true
    packedBy.baishakhi = true
  }
  return packedBy
}
