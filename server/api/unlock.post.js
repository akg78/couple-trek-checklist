export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const expected = config.trekPin

  if (!expected || expected.length !== 6) {
    throw createError({
      statusCode: 503,
      statusMessage: 'PIN is not configured on the server.'
    })
  }

  const body = await readBody(event)
  const pin = body?.pin?.trim()

  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid PIN format.' })
  }

  if (pin !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Wrong PIN.' })
  }

  return { ok: true }
})
