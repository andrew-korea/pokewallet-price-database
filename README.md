# PokeWallet Price Database

A Pokémon TCG card price lookup site, served via Netlify Functions and aggregating
pricing from TCGPlayer and CardMarket.

## Running locally

```
npm install
netlify dev
```

Requires a `POKEWALLET_API_KEY` environment variable set in your Netlify site
(or a local `.env` file) to authenticate against the upstream pricing API.

## License

MIT — see [LICENSE](./LICENSE).

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
