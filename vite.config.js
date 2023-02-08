// vite.config.(js|ts)
import { defineConfig } from "vite"
import pugPlugin from "vite-plugin-pug"

const options = {basedir: ".", pretty: true}
const locals = {
  env: "development",
  sponsorUrl: "https://github.com/sponsors/anycable",
  formURL: "https://form.typeform.com/to/wAHm0sRP",
  proFormUrl: "https://form.typeform.com/to/BwBcZmdQ",
}

export default defineConfig({
  plugins: [pugPlugin(options, locals)],
})
