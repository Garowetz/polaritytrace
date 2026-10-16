# Polarity Trace

An interactive website that shows how light travels through a fibre link, from
the transmitter (Tx) on the left to the receiver (Rx) on the right, through MPO
trunks, cassettes, patch cords and optics.

It's for anyone who needs to understand polarity and order the right parts.
It's not a design tool for fibre engineers.

Intended domain: polaritytrace.com.

## Run it locally

You need [Node.js](https://nodejs.org) 24 or newer.

```sh
npm install      # once
npm run dev      # start the site at http://localhost:5173
npm test         # run the polarity engine tests
npm run build    # production build into dist/
```

## How it's organised

| Folder | What's in it |
|---|---|
| `src/engine` | The polarity engine: pure TypeScript with unit tests. All polarity decisions happen here. |
| `src/data` | Every trunk, cassette, cord and optic, each with a `source` and `verified` field. |
| `src/ui` | React components. They only draw what the engine returns. |
| `src/styles` | Colour, type and spacing tokens, and the light and dark themes. |
| `docs/polarity-reference.md` | The cited source of truth for every mapping and pinout. |

## Deploying

Every push to `main` runs the tests, builds the site and publishes it to GitHub
Pages (`.github/workflows/deploy.yml`).

To use a custom domain later:
1. Add `public/CNAME` containing the domain.
2. Change `BASE_PATH` in the workflow to `/`.
3. Point the domain's DNS at GitHub Pages and set it under Settings → Pages.
