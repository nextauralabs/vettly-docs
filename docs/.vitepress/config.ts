import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Vettly',
  description: 'Protect your users from harmful content - Documentation & API Reference',

  // Ignore dead links for now (we'll add the pages later)
  ignoreDeadLinks: true,

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Components', link: '/components/overview' },
      { text: 'API Reference', link: '/api/sdk' },
      { text: 'Examples', link: '/examples/social-feed' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Vettly?', link: '/guide/what-is-vettly' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'How It Works', link: '/guide/how-it-works' },
            { text: 'Moderation Policies', link: '/guide/policies' },
            { text: 'Multi-Modal Content', link: '/guide/multi-modal' },
          ]
        }
      ],

      '/components/': [
        {
          text: 'React Components',
          items: [
            { text: 'Overview', link: '/components/overview' },
            { text: 'ModeratedTextarea', link: '/components/textarea' },
            { text: 'ModeratedImageUpload', link: '/components/image-upload' },
            { text: 'ModeratedVideoUpload', link: '/components/video-upload' },
            { text: 'useModeration Hook', link: '/components/use-moderation' },
          ]
        }
      ],

      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'SDK', link: '/api/sdk' },
            { text: 'REST API', link: '/api/rest' },
            { text: 'Webhooks', link: '/api/webhooks' },
          ]
        },
        {
          text: 'Integrations',
          items: [
            { text: 'Next.js', link: '/api/nextjs' },
            { text: 'Express', link: '/api/express' },
            { text: 'Unity', link: '/api/unity' },
          ]
        }
      ],

      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Social Feed', link: '/examples/social-feed' },
            { text: 'Forum', link: '/examples/forum' },
            { text: 'Chat App', link: '/examples/chat' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/brian-nextaura/vettly-docs' }
    ],

    footer: {
      copyright: 'Copyright © 2024 Next Aura Labs'
    },

    search: {
      provider: 'local'
    }
  },

  vite: {
    plugins: []
  }
})
