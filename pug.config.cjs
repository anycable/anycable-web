process = require("process");

const config = {
  "basedir": "src",
  "locals": {
    "env": process.env.NODE_ENV || "development",
    "sponsorUrl": "https://github.com/sponsors/anycable",
    "formURL": "https://form.typeform.com/to/wAHm0sRP",
    "proFormUrl": "https://form.typeform.com/to/BwBcZmdQ"
  }
}

module.exports = config
