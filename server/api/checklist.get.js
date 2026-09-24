export default defineEventHandler(async () => {
  const data = await readChecklist()
  return {
    revision: data.revision,
    items: data.items
  }
})
