import type { Plugin } from '@saltyaom/gql'
import { hash } from '@saltyaom/gql'

const cache: Cache = {}

export type Cache = Record<number, CacheValue>
export interface CacheValue {
	data: Object
	expires: number
}

let invalidatingCache = false

// Making run behind after scope end by marking it as async
export const invalidateCaches = async () => {
	if (invalidatingCache) return

	invalidatingCache = true

	Object.entries(cache).forEach(([key, cached]) => {
		if (Date.now() > cached?.expires) delete cache[+key]
	})

	invalidatingCache = false
}

interface GqlLocalCacheConfig {
	/**
	 * Time to Live
	 * @default 86400 (1 day)
	 *
	 * How long should the cache live in seconds.
	 */
	ttl?: number
}

const { stringify: str } = JSON

type Resolver = (v: Object | null) => void
type Pending = [Promise<Object | null>, Resolver]

const pendings: Record<number, Pending> = {}

const createPending = (key: number) => {
	let resolver: Resolver = () => {}
	const pending = new Promise<Object | null>((resolve) => {
		resolver = resolve
	})

	pendings[key] = [pending, resolver]
}

/**
 * gql local cache plugins
 *
 * @example
 * ```typescript
 * import InMemoryCache from '@saltyaom/gql-inmemory-cache'
 *
 * client.config('/graphql', {
 *   plugins: [InMemoryCache()]
 * })
 * ```
 */
const gqlLocalCache = ({ ttl = 86400 }: GqlLocalCacheConfig = {}): Plugin => ({
	middlewares: [
		async ({ hash, variables, query }) => {
			let pending = pendings[hash]
			if (pending) {
				let cache = await pending[0]
				if (cache) return cache
			}

			let cached = cache[hash]
			if (!cached) {
				createPending(hash)
				invalidateCaches()

				return
			}

			let expired = Date.now() > cached?.expires
			if (expired) {
				createPending(hash)

				delete cache[hash]
				invalidateCaches()

				return
			}

			invalidateCaches()

			return cached.data
		}
	],
	afterwares: [
		async ({ hash, data, variables, query }) => {
			let pending = pendings[hash]

			if (pending) {
				pending[1](data)
				delete pendings[hash]
			}

			if (!data) return null
			cache[hash] = {
				data,
				expires: Date.now() + ttl * 1000
			}
		}
	]
})

export default gqlLocalCache
