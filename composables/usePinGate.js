const UNLOCK_KEY = 'trek-checklist-unlocked'

export function usePinGate() {
  const unlocked = ref(false)
  const ready = ref(false)
  const pin = ref('')
  const pinError = ref('')
  const checking = ref(false)

  const init = () => {
    if (import.meta.client) {
      unlocked.value = sessionStorage.getItem(UNLOCK_KEY) === '1'
    }
    ready.value = true
  }

  const submitPin = async () => {
    pinError.value = ''
    pin.value = pin.value.replace(/\D/g, '').slice(0, 6)

    if (!/^\d{6}$/.test(pin.value)) {
      pinError.value = 'Enter the 6-digit PIN.'
      return
    }

    checking.value = true
    try {
      await $fetch('/api/unlock', { method: 'POST', body: { pin: pin.value } })
      sessionStorage.setItem(UNLOCK_KEY, '1')
      unlocked.value = true
      pin.value = ''
    } catch (error) {
      const status = error?.statusCode ?? error?.response?.status
      if (status === 503) {
        pinError.value = 'Server PIN not set. Add NUXT_TREK_PIN on Vercel and redeploy.'
      } else if (status === 401) {
        pinError.value = 'Wrong PIN. Try again.'
      } else {
        pinError.value = 'Could not verify PIN. Restart dev server or try again.'
      }
    } finally {
      checking.value = false
    }
  }

  return { unlocked, ready, pin, pinError, checking, init, submitPin }
}
