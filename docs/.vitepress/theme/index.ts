import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import TranscriptDemo from './TranscriptDemo.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('TranscriptDemo', TranscriptDemo)
  },
} satisfies Theme
