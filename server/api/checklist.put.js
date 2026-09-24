export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const items = body?.items

  if (!Array.isArray(items)) {
    throw createError({ statusCode: 400, statusMessage: 'Expected { items: [] }' })
  }

  for (const item of items) {
    if (!item?.id || !item?.name || typeof item.done !== 'boolean') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid checklist item' })
    }
    if (item.packedBy && typeof item.packedBy === 'object') {
      item.packedBy.ankit = Boolean(item.packedBy.ankit)
      item.packedBy.baishakhi = Boolean(item.packedBy.baishakhi)
    }
  }

  const saved = await writeChecklist(items)
  return {
    revision: saved.revision,
    items: saved.items
  }
})
