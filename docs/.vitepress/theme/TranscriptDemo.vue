<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'

const fixtures = [
  { label: 'Three lines', file: 'three-lines.jsonl' },
  { label: 'Tool call', file: 'tool-call.jsonl' },
]

const selected = ref(fixtures[0].file)
const transcript = ref('')

async function load(file: string) {
  const response = await fetch(withBase(`/fixtures/${file}`))
  transcript.value = await response.text()
}

onMounted(async () => {
  // Lit touches window at import time, so the element loads client-side only.
  await import('telelux-element')
  await load(selected.value)
})

watch(selected, load)
</script>

<template>
  <div class="transcript-demo">
    <label>
      Fixture
      <select v-model="selected">
        <option v-for="fixture in fixtures" :key="fixture.file" :value="fixture.file">
          {{ fixture.label }}
        </option>
      </select>
    </label>
    <textarea v-model="transcript" spellcheck="false" rows="8"></textarea>
    <telelux-transcript :transcript.prop="transcript"></telelux-transcript>
  </div>
</template>

<style scoped>
.transcript-demo {
  display: grid;
  gap: 0.75rem;
  margin: 1rem 0;
}

textarea {
  width: 100%;
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  padding: 0.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
}

telelux-transcript {
  display: block;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
}
</style>
