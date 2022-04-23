import gql, { client } from '@saltyaom/gql'
import InMemoryCache from '@saltyaom/inmemory-cache'

client.config('https://api.hifumin.app/graphql', {
	plugins: [InMemoryCache()]
})

const query = `query GQLInMemoryCacheSample($id: Int!) {
  nhql {
    by(id: $id) {
      success
      error
      data {
        id
        title {
          display
        }
      }
    }
  }
}`

gql(query, {
	variables: {
		id: 177013
	}
}).then(async (data) => {
	const t = performance.now()
	await gql(query, {
		variables: {
			id: 177013
		}
	})
	console.log(`2nd operation take: ${performance.now() - t}ms`)
})
