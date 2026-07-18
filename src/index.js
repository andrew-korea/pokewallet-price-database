import { onRequestGet as getSets } from '../functions/sets.js'
import { onRequestGet as getSearch } from '../functions/search.js'
import { onRequestGet as getSetCards } from '../functions/set-cards.js'
import { onRequestGet as getImage } from '../functions/image.js'

const ROUTES = {
  '/sets': getSets,
  '/search': getSearch,
  '/set-cards': getSetCards,
  '/image': getImage,
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const handler = ROUTES[url.pathname]

    if (handler) {
      return handler({ request, env, ctx })
    }

    return env.ASSETS.fetch(request)
  },
}
