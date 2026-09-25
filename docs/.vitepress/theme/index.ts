import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import HtmlPlayground from './HtmlPlayground.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HtmlPlayground', HtmlPlayground)
  },
} satisfies Theme
