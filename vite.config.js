// vite.config.(js|ts)
import { defineConfig } from "vite"
import pugPlugin from "vite-plugin-pug"
import "process"
import { resolve } from "path"
import { default as fg } from "fast-glob"

const options = {basedir: "src", pretty: true, localImports: true}
const locals = {
  env: process.env.NODE_ENV || "development",
  sponsorUrl: "https://github.com/sponsors/anycable",
  formURL: "https://form.typeform.com/to/wAHm0sRP",
  proFormUrl: "https://form.typeform.com/to/BwBcZmdQ",
}

const root = resolve(__dirname, 'src')

const pages = fg.sync(resolve(root, '**/*/index.html')).map(path => {
  let url = path.slice(root.length).replace(/\/index\.html$/, '')

  return url
})

// Sort pages to match by the longest url prefix in the dev middleware
pages.sort((a, b) => a < b ? 1 : -1)

export default defineConfig({
  appType: 'mpa',
  root: root,
  plugins: [
    pugPlugin(options, locals),
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
    emptyOutDir: true,
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
