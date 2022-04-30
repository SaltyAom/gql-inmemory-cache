import gql, { client } from '@saltyaom/gql'
import InMemoryCache from '@saltyaom/inmemory-cache'

client.config('https://api.hifumin.app/graphql', {
	plugins: [InMemoryCache()]
})

const runQuery = () =>
	gql(
		`query GQLInMemoryCacheSample($id: Int!) {
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
  }`,
		{
			variables: {
				id: 177013
			}
		}
	)

// const waterfall = async () => {
// 	for (let i = 0; i <= 3; i++) {
// 		const t = performance.now()
// 		console.log(await runQuery())
// 	}
// }

// waterfall()

const parallel = async () => {
	for (let i = 0; i <= 3; i++) {
		const t = performance.now()

		runQuery().then((v) => {
			console.log(`${i} operation take: ${performance.now() - t}ms`, v)
		})
	}
}

parallel()
