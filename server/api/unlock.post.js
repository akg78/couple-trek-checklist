function getExpectedPin(config) {
  const raw =
    config.trekPin ||
    process.env.NUXT_TREK_PIN ||
    process.env.TREK_PIN ||
    ''
  return String(raw).trim()
}

export default defineEventHandler(async (event) => {
  const expected = getExpectedPin(useRuntimeConfig())

  if (!expected || expected.length !== 6 || !/^\d{6}$/.test(expected)) {
    throw createError({
      statusCode: 503,
      statusMessage: 'PIN is not configured on the server (set NUXT_TREK_PIN or TREK_PIN).'
    })
  }

  const body = await readBody(event)
  const pin = String(body?.pin ?? '').trim()

  if (!/^\d{6}$/.test(pin)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid PIN format.' })
  }

  if (pin !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Wrong PIN.' })
  }

  return { ok: true }
})
