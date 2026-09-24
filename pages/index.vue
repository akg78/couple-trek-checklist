<script setup lang="ts">
const {
  items,
  hydrated,
  load,
  addItem: saveItem,
  toggleItem,
  removeItem,
  restoreStarter,
  exportBackup,
  importBackup
} = useTrekChecklist()

const filter = ref<'all' | 'pending' | 'done'>('all')
const newItem = ref('')
const newCategory = ref<string>(TREK_CATEGORIES[0])
const newOwner = ref(DEFAULT_OWNER)

const filtered = computed(() =>
  items.value.filter(i =>
    filter.value === 'all' ||
    (filter.value === 'done' ? i.done : !i.done)
  )
)

const grouped = computed(() => {
  const map = new Map<string, typeof items.value>()
  for (const item of filtered.value) {
    if (!map.has(item.category)) map.set(item.category, [])
    map.get(item.category)!.push(item)
  }
  return TREK_CATEGORIES.filter(cat => map.has(cat)).map(cat => [cat, map.get(cat)!] as const)
})

const completed = computed(() => items.value.filter(i => i.done).length)
const progress = computed(() =>
  items.value.length ? Math.round(completed.value / items.value.length * 100) : 0
)

const addItem = () => {
  if (saveItem(newItem.value, newCategory.value, newOwner.value)) {
    newItem.value = ''
  }
}

const confirmRemove = (item: (typeof items.value)[number]) => {
  if (confirm(`Delete "${item.name}"?`)) removeItem(item)
}

const confirmRestore = () => {
  if (confirm('Reset to the full default list? All ticks will be cleared.')) {
    restoreStarter()
  }
}

onMounted(() => load())
</script>

<template>
  <main v-if="hydrated" class="page">
    <section class="hero">
      <div>
        <div class="eyebrow">🏔️ ANKIT & BAISHAKHI</div>
        <h1>Our Trek Checklist</h1>
        <p>Tungnath → Chandrashila</p>
      </div>
      <div class="progress-card" aria-live="polite">
        <strong>{{ progress }}%</strong>
        <span>{{ completed }} / {{ items.length }} packed</span>
      </div>
    </section>

    <div class="progress" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
      <span :style="{ width: `${progress}%` }" />
    </div>

    <section class="add-card">
      <input
        v-model="newItem"
        type="text"
        enterkeyhint="done"
        autocomplete="off"
        placeholder="Add item…"
        aria-label="New item"
        @keyup.enter="addItem"
      />
      <select v-model="newCategory" aria-label="Category">
        <option v-for="c in TREK_CATEGORIES" :key="c">{{ c }}</option>
      </select>
      <select v-model="newOwner" aria-label="Owner">
        <option v-for="owner in TREK_OWNERS" :key="owner">{{ owner }}</option>
      </select>
      <button type="button" class="btn-primary" @click="addItem">＋ Add</button>
    </section>

    <nav class="filters" aria-label="Filter checklist">
      <button type="button" :class="{ active: filter === 'all' }" @click="filter = 'all'">All</button>
      <button type="button" :class="{ active: filter === 'pending' }" @click="filter = 'pending'">Pending</button>
      <button type="button" :class="{ active: filter === 'done' }" @click="filter = 'done'">Packed</button>
    </nav>

    <section v-for="[category, categoryItems] in grouped" :key="category" class="section">
      <h2>{{ category }}</h2>
      <label
        v-for="item in categoryItems"
        :key="item.id"
        class="item"
        :class="{ checked: item.done }"
      >
        <input
          type="checkbox"
          class="item-check"
          :checked="item.done"
          @change="toggleItem(item)"
        />
        <span class="item-body">
          <span class="item-name">{{ item.name }}</span>
          <span class="owner">{{ item.owner }}</span>
        </span>
        <button
          type="button"
          class="delete"
          aria-label="Delete item"
          @click.prevent="confirmRemove(item)"
        >
          ×
        </button>
      </label>
    </section>

    <div v-if="!grouped.length" class="empty">No items in this view.</div>

    <footer class="footer-actions">
      <button type="button" @click="exportBackup">Share backup</button>
      <button type="button" @click="importBackup">Import backup</button>
      <button type="button" @click="confirmRestore">Restore starter</button>
    </footer>
  </main>
</template>
