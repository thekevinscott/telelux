<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import type { EditorView } from 'codemirror'
import type { Compartment } from '@codemirror/state'

const initial = [
  '<script type="module" src="/playground/telelux-element.js"><\/script>',
  '',
  '<telelux-transcript></telelux-transcript>',
  '',
].join('\n')

const { isDark } = useData()
const editor = ref<HTMLElement>()
const source = ref(initial)
let view: EditorView | undefined
let theme: Compartment | undefined
let pending: ReturnType<typeof setTimeout> | undefined

onMounted(async () => {
  const [{ EditorView, basicSetup }, { Compartment }, { html }, { oneDark }] = await Promise.all([
    import('codemirror'),
    import('@codemirror/state'),
    import('@codemirror/lang-html'),
    import('@codemirror/theme-one-dark'),
  ])
  theme = new Compartment()
  view = new EditorView({
    doc: initial,
    parent: editor.value,
    extensions: [
      basicSetup,
      html(),
      theme.of(isDark.value ? oneDark : []),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return
        clearTimeout(pending)
        pending = setTimeout(() => {
          source.value = update.state.doc.toString()
        }, 300)
      }),
    ],
  })
  watch(isDark, (dark) => {
    view?.dispatch({ effects: theme!.reconfigure(dark ? oneDark : []) })
  })
})

onBeforeUnmount(() => {
  clearTimeout(pending)
  view?.destroy()
})
</script>

<template>
  <div class="html-playground">
    <div ref="editor" class="editor"></div>
    <iframe :srcdoc="source" sandbox="allow-scripts allow-same-origin" title="Preview"></iframe>
  </div>
</template>

<style scoped>
.html-playground {
  display: grid;
  gap: 0.75rem;
  margin: 1rem 0;
}

.editor,
iframe {
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
}

.editor :deep(.cm-editor) {
  font-size: 0.85rem;
  min-height: 10rem;
}

iframe {
  width: 100%;
  min-height: 12rem;
  background: white;
}
</style>
