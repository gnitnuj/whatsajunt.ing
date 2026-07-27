[![Netlify Status](https://api.netlify.com/api/v1/badges/3ad744b1-e8a8-4fa7-9c90-4ca6c1d9864a/deploy-status)](https://app.netlify.com/sites/subtle-malasada-38cb70/deploys)

## About this project

whatsajunt.ing (formerly whatsajunting.com) is my personal website that is usually up, but may be down occasionally, and updated when inspiration strikes every few years.

## Development

The site is built with [Eleventy](https://www.11ty.dev/). Existing pages remain
plain HTML and are published unchanged, so this migration does not change any
URLs. New pages should use the shared `base.njk` layout and partials in
`_includes/` to avoid duplicating metadata, navigation, and analytics.

```sh
npm install
npm start
```

Use `npm run build` to generate the deployable site in `_site/`. Netlify is
configured to run that command and publish the generated directory.
