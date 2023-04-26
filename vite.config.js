// vite.config.(js|ts)
import { defineConfig } from "vite"
import pugPlugin from "vite-plugin-pug"
import handlebars from 'vite-plugin-handlebars'
import { default as MarkdownIt } from 'markdown-it'
import { default as MarkdownItClassy } from 'markdown-it-classy'
import { default as MarkdownItHighlightJS }  from 'markdown-it-highlightjs'
import { default as Handlebars } from 'handlebars'
import "process"
import { resolve } from "path"
import { readFileSync  } from "fs"
import { default as fg } from "fast-glob"

const config = {
  sponsorUrl: "https://github.com/sponsors/anycable",
  formURL: "https://form.typeform.com/to/wAHm0sRP",
  proFormUrl: "https://form.typeform.com/to/BwBcZmdQ",
  tracking: process.env.NODE_ENV == 'production'
}

const root = resolve(__dirname, 'src')

const pages = fg.sync(resolve(root, '**/*/index.html')).map(path => {
  let url = path.slice(root.length).replace(/\/index\.html$/, '')

  return url
}).sort((a, b) => a < b ? 1 : -1) // Sort pages to match by the longest url prefix in the dev middleware

const pugOptions = {basedir: "src", pretty: true, localImports: true}

const markdownIt = new MarkdownIt({html: true})
markdownIt.use(MarkdownItClassy)
markdownIt.use(MarkdownItHighlightJS)

const handlebarsHelpers = {
  'inline': (path) => {
    return new Handlebars.SafeString(readFileSync(resolve(root, path)))
  },
  'md': (path, options) => {
    if (path.startsWith('.')) {
      path = resolve(root, options.data.root.__file__.replace(/[^\/]+\.html$/, path))
    } else {
      path = resolve(root, path)
    }

    return new Handlebars.SafeString(markdownIt.render(readFileSync(path).toString()))
  },
  'coalesce': (...vars) => {
    return new Handlebars.SafeString(vars.find(v => v))
  },
  'youtube': (videoId, linkType) => {
    switch(linkType) {
      case 'video': {
        return new Handlebars.SafeString(`https://youtube.com/watch?v=${videoId}`)
      }
      case 'thumbnail': {
        return new Handlebars.SafeString(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`)
      }
    }
  },
  'currentYear': () => {
    return (new Date()).getFullYear()
  }
}

export default defineConfig({
  appType: 'mpa',
  root: root,
  plugins: [
    pugPlugin(pugOptions, config),
    handlebars({
      partialDirectory: resolve(root, 'partials'),
      context: (path) => {
        return { ...config, __file__: path.replace(/^\//, '') }
      },
      helpers: handlebarsHelpers
    }),
    {
      name: 'rewrite-middleware',
      configureServer(serve) {
        serve.middlewares.use((req, res, next) => {
          for(let page of pages) {
            if (req.url.startsWith(page)) {
              req.url = `${page}/index.html`;
              break
            }
          }
          next()
        })
      }
    }
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    rollupOptions: {
      input: {
        ...pages.reduce((acc, url) => {
          acc[url.replace("/", "")] = resolve(root, url, "index.html")
          return acc
        }, {}),
        main: resolve(root, 'index.html'),
      },
    },
  },
})
