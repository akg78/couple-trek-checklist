const UNLOCK_KEY = 'trek-checklist-unlocked'

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
      const savedUser = sessionStorage.getItem(USER_STORAGE_KEY)
      const savedUnlock = sessionStorage.getItem(UNLOCK_KEY) === '1'
      if (savedUser && TREK_USER_OPTIONS.some(u => u.id === savedUser)) {
        userId.value = savedUser
      }
      unlocked.value = savedUnlock && Boolean(userId.value)
    }
    ready.value = true
  }

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
      sessionStorage.setItem(UNLOCK_KEY, '1')
      sessionStorage.setItem(USER_STORAGE_KEY, userId.value)
      unlocked.value = true
      pin.value = ''
    } catch {
      pinError.value = 'Could not verify PIN. Try again.'
    } finally {
      checking.value = false
    }
  }

  const signOut = () => {
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
