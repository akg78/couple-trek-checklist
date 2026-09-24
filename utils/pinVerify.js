// SHA-256 of the 6-digit unlock code (not stored in plain text in source).
const PIN_SHA256 = 'c922a25f9b38b3a5a30c354246275af1dd5588d916ad8de33ba669f1b4ae32e4'

export async function isValidPin(pin) {
  const data = new TextEncoder().encode(String(pin))
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashHex = [...new Uint8Array(hashBuffer)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
  return hashHex === PIN_SHA256
}
