# PokeWallet Price Database

A Pokémon TCG card price lookup site, served via Cloudflare Pages Functions and
aggregating pricing from TCGPlayer and CardMarket.

## Running locally

```
npx wrangler pages dev .
```

Requires a `POKEWALLET_API_KEY` environment variable and a `POKEWALLET_CACHE` KV
namespace binding configured in your Cloudflare Pages project (or a local `.dev.vars`
file for the API key) to authenticate against the upstream pricing API.

## License

MIT — see [LICENSE](./LICENSE).

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
