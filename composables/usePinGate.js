const UNLOCK_KEY = 'trek-checklist-unlocked'
const LAST_USER_KEY = 'trek-checklist-last-user'

function readStoredUser() {
  if (!import.meta.client) return null
  const fromLocal = localStorage.getItem(USER_STORAGE_KEY)
  if (fromLocal) return fromLocal
  const fromSession = sessionStorage.getItem(USER_STORAGE_KEY)
  if (fromSession) {
    localStorage.setItem(USER_STORAGE_KEY, fromSession)
    return fromSession
  }
  return null
}

function isStoredUnlocked() {
  if (!import.meta.client) return false
  if (localStorage.getItem(UNLOCK_KEY) === '1') return true
  if (sessionStorage.getItem(UNLOCK_KEY) === '1') {
    localStorage.setItem(UNLOCK_KEY, '1')
    return true
  }
  return false
}

export function usePinGate() {
  const unlocked = ref(false)
  const ready = ref(false)
  const pin = ref('')
  const userId = ref('')
  const pinError = ref('')
  const checking = ref(false)

  const currentUserLabel = computed(() => userIdToLabel(userId.value))

  const init = () => {
    if (import.meta.client) {
      const savedUser = readStoredUser()
      const savedUnlock = isStoredUnlocked()
      let user = savedUser
      if (!user) {
        const last = localStorage.getItem(LAST_USER_KEY)
        if (last && TREK_USER_OPTIONS.some(u => u.id === last)) user = last
      }
      if (user && TREK_USER_OPTIONS.some(u => u.id === user)) {
        userId.value = user
      }
      unlocked.value = savedUnlock && Boolean(savedUser)
    }
    ready.value = true
  }

  watch(userId, (id) => {
    if (!import.meta.client || !id) return
    if (TREK_USER_OPTIONS.some(u => u.id === id)) {
      localStorage.setItem(LAST_USER_KEY, id)
    }
  })

  const submitPin = async () => {
    pinError.value = ''
    pin.value = pin.value.replace(/\D/g, '').slice(0, 6)

    if (!userId.value) {
      pinError.value = 'Choose your name first.'
      return
    }
    if (!/^\d{6}$/.test(pin.value)) {
      pinError.value = 'Enter the 6-digit PIN.'
      return
    }

    checking.value = true
    try {
      const ok = await isValidPin(pin.value)
      if (!ok) {
        pinError.value = 'Wrong PIN. Try again.'
        return
      }
      localStorage.setItem(UNLOCK_KEY, '1')
      localStorage.setItem(USER_STORAGE_KEY, userId.value)
      localStorage.setItem(LAST_USER_KEY, userId.value)
      sessionStorage.removeItem(UNLOCK_KEY)
      sessionStorage.removeItem(USER_STORAGE_KEY)
      unlocked.value = true
      pin.value = ''
    } catch {
      pinError.value = 'Could not verify PIN. Try again.'
    } finally {
      checking.value = false
    }
  }

  const signOut = () => {
    localStorage.removeItem(UNLOCK_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    sessionStorage.removeItem(UNLOCK_KEY)
    sessionStorage.removeItem(USER_STORAGE_KEY)
    unlocked.value = false
    userId.value = ''
    pin.value = ''
  }

  return {
    unlocked,
    ready,
    pin,
    userId,
    pinError,
    checking,
    currentUserLabel,
    init,
    submitPin,
    signOut
  }
}
