# `@usesimpler/sdk-core`

The **Simpler API client**. Install this package. It depends on the published **Integrator schema package** (`@usesimpler/api-schema`); you do not install or import that package yourself.

```sh
npm install @usesimpler/sdk-core
```

`forSite` takes a Site API key and reads Site branding, Pages, and Listings with their media. `forTeam` and `forOrg` expose no resources.

Non-2xx responses throw `SimplerApiError`, with the API's message and the HTTP `status`. A Site with no included stages cannot serve listings: `listings.list`, `listings.get`, and `listings.listMedia` throw a `409` whose message says to add at least one stage to the Site's included stages in Simpler. A Site with included stages but no matching listings returns an empty list.

The public OpenAPI document is [`openapi/public-openapi.json`](../../openapi/public-openapi.json).

## Support window

While the API is on 0.x, the current and previous minor are supported. A changelog deprecation notice is published before a minor is dropped. After 1.0, each major is supported for at least 12 months.

Canary builds from `main` are published on the `canary` dist-tag:

```sh
npm install @usesimpler/sdk-core@canary
```
