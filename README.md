# @saltyaom/in-memory-cache
In-Memory Cache for [@saltyaom/gql](https://github.com/saltyaom/graphql-client)

## Example Usage
```typescript
import gql, { client } from '@saltyaom/gql'
import InMemoryCache from '@saltyaom/gql-inmemory-cache'

client.config(
  'https://api.hifumin.app', 
  {
    plugins: [InMemoryCache()]
  }
)

gql(
  `query GetHentaiById($id: Int!) {
    getHentaiById(id: $id) {
      success
      data {
        title {
          display
          japanese
        }
      }
    }
  }`,
  {
    variables: {
      id: 177013
    }
  }
).then((data) => {
  console.log(data)
})
```

## Custom Config
You can pass custom config to `localCache()`

Available config:
- ttl
  - How long should the cache live in seconds.
  - default: 86400 seconds (1 days)
