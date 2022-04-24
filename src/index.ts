import type { Plugin } from '@saltyaom/gql'

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

// https://stackoverflow.com/a/52171480
const tsh = (s: string) => {
	for (var i = 0, h = 9; i < s.length; )
		h = Math.imul(h ^ s.charCodeAt(i++), 9 ** 9)

	return h ^ (h >>> 9)
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
		async ({ operationName, variables, query }) => {
			let key = tsh(str(variables) + query)

			let pending = pendings[key]
			if (pending) {
				const cache = await pending[0]
				if (cache) return cache
			}

			const cached = cache[key]
			if (!cached) {
				createPending(key)
				invalidateCaches()

				return
			}

			const expired = Date.now() > cached?.expires
			if (expired) {
				createPending(key)

				delete cache[key]
				invalidateCaches()

				return
			}

			invalidateCaches()

			return cached.data
		}
	],
	afterwares: [
		async ({ data, operationName, variables, query }) => {
			let key = tsh(str(variables) + query)
			let pending = pendings[key]

			if (pending) {
				delete pendings[key]
				pending[1](data)
			}

			if (!data) return null

			cache[key] = {
				data,
				expires: Date.now() + ttl * 1000
			}
		}
	]
})

export default gqlLocalCache
