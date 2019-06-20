## About

AnyCable website generator (https://anycable.io).

Includes:
- [Jade](http://jade-lang.com) HTML preprocessor;
- [PostCSS](https://github.com/postcss/postcss) with [autoprefixer](https://github.com/postcss/autoprefixer), [precss](https://github.com/jonathantneal/precss) and [cssnext](http://cssnext.io);
- [JSPM](http://jspm.io) with ES6 set up.

## Usage

Run `npm install` and then `npm start` or `gulp` to start dev server with livereload.

## SVG Optimization

Use [svgo](https://github.com/svg/svgo) to optimize SVG images.

For animated illustration use: `svgo --disable=moveGroupAttrsToElems --disable=convertTransform src/images/illustration.svg src/images/illustration.min.svg`

## GTM Integration

To send custom events to GTM do the following:
- For links (or link-like elements) use `gtm-link` class and specify action and category using `data-gtm-action` and `data-gtm-category` attributes:

```pug
a.gtm-link(href="#", data-gtm-category="landingButton", data-gtm-action="tryIt1")
```

- For footer links you can alternatively just add a `gtm-footer-link` class without specifying any data attributes (`footerLinks` `category` and `action` derived from the link text will be used automatically). The `action` value could be overriden by setting `data-gtm-action` attribute.

- For form submissions use `gtm-form` class and the same `data-gtm-category` and `data-gtm-action` attributes.

**NOTE:** in development, we print events in the console instead of sending them to GTM. See `dochead.pug` for more.
