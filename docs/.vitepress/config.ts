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
    // One sidebar for the whole site: a path-scoped sidebar would swap the
    // tree out per package and hide the other two.
    sidebar: {
      '/': [
        {
          text: 'Web component',
          items: [
            { text: 'Getting started', link: '/component/' },
            { text: 'How-to guides', link: '/component/guide/' },
            {
              text: 'Reference',
              items: [
                { text: 'Package', link: '/component/reference/' },
                { text: 'Migrations', link: '/migrations' },
              ],
            },
            { text: 'Explanation', link: '/component/explanation/' },
          ],
        },
        {
          text: 'App',
          items: [
            { text: 'Getting started', link: '/app/' },
            { text: 'How-to guides', link: '/app/guide/' },
            { text: 'Reference', link: '/app/reference/' },
            { text: 'Explanation', link: '/app/explanation/' },
          ],
        },
        {
          text: 'Python',
          items: [
            { text: 'Getting started', link: '/python/' },
            { text: 'How-to guides', link: '/python/guide/' },
            {
              text: 'Reference',
              items: [
                { text: 'API', link: '/python/reference/' },
                { text: 'Migrations', link: '/migrations' },
              ],
            },
            { text: 'Explanation', link: '/python/explanation/' },
          ],
        },
        {
          text: 'Contributing',
          items: [
            { text: 'Testing conventions', link: '/contributing/testing-conventions' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/thekevinscott/telelux' },
    ],
    search: { provider: 'local' },
    outline: [2, 3],
  },
})
