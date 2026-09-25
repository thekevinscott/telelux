import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Telelux',
  description: 'Agent transcripts, rendered.',
  base: '/',
  cleanUrls: true,
  srcExclude: ['**/AGENTS.md', 'internals/**'],
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === 'telelux-transcript',
      },
    },
  },
  themeConfig: {
    nav: [
      { text: 'Web component', link: '/component/' },
      { text: 'App', link: '/app/' },
      { text: 'Python', link: '/python/' },
    ],
    sidebar: {
      '/': [
        {
          text: 'Web component',
          items: [
            { text: 'Getting started', link: '/component/' },
            { text: 'Demo', link: '/component/demo' },
          ],
        },
        { text: 'App', link: '/app/' },
        { text: 'Python', link: '/python/' },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/thekevinscott/telelux' },
    ],
    search: { provider: 'local' },
    outline: [2, 3],
  },
})
