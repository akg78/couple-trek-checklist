<script setup>
const { unlocked, ready: pinReady, pin, pinError, checking, init, submitPin } = usePinGate()

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

const filter = ref('all')
const newItem = ref('')
const newCategory = ref(TREK_CATEGORIES[0])
const newOwner = ref(DEFAULT_OWNER)

const filtered = computed(() =>
  items.value.filter(i =>
    filter.value === 'all' ||
    (filter.value === 'done' ? i.done : !i.done)
  )
)

const grouped = computed(() => {
  const map = new Map()
  for (const item of filtered.value) {
    if (!map.has(item.category)) map.set(item.category, [])
    map.get(item.category).push(item)
  }
  return TREK_CATEGORIES.filter(cat => map.has(cat)).map(cat => [cat, map.get(cat)])
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

const confirmRemove = (item) => {
  if (confirm(`Delete "${item.name}"?`)) removeItem(item)
}

const confirmRestore = () => {
  if (confirm('Reset to the full default list? All ticks will be cleared.')) {
    restoreStarter()
  }
}

onMounted(() => {
  init()
})

watch(unlocked, value => {
  if (value && !hydrated.value) load()
}, { immediate: true })
</script>

<template>
  <div v-if="pinReady && !unlocked" class="pin-screen">
    <div class="pin-card">
      <div class="eyebrow">🏔️ TREK CHECKLIST</div>
      <h1>Enter PIN</h1>
      <p class="pin-lead">6-digit code to open the packing list.</p>
      <input
        v-model="pin"
        type="password"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="6"
        autocomplete="one-time-code"
        class="pin-input"
        placeholder="••••••"
        aria-label="6-digit PIN"
        @input="pin = pin.replace(/\D/g, '').slice(0, 6)"
        @keyup.enter="submitPin"
      />
      <p v-if="pinError" class="pin-error" role="alert">{{ pinError }}</p>
      <button type="button" class="btn-primary pin-submit" :disabled="checking" @click="submitPin">
        {{ checking ? 'Checking…' : 'Unlock' }}
      </button>
    </div>
  </div>

  <main v-else-if="unlocked && hydrated" class="page">
    <section class="hero">
      <div>
        <div class="eyebrow">🏔️ COUPLE TREK</div>
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
