# Simpler SDK

Public source of truth for the **Integrator schema package** (`@usesimpler/api-schema`) and the **Simpler API client** (`@usesimpler/sdk-core`).

Integrators install the client from npmjs.com. No token is required. The schema package is a dependency of the client; integrators do not install or import it themselves.

```sh
npm install @usesimpler/sdk-core
```

`forSite` takes a Site API key and reads Site branding, Pages, and Listings with their media. `forTeam` and `forOrg` ship in the same client and expose no resources.

## Public OpenAPI document

[`openapi/public-openapi.json`](openapi/public-openapi.json) is generated from the integrator schemas. A path is added only when a resource is promoted onto the Integrator API surface.

## Support window

While the API is on 0.x, the current and previous minor are supported. A deprecation notice is published before a minor is dropped. After 1.0, each major is supported for at least 12 months.

## Releases

`@usesimpler/api-schema` and `@usesimpler/sdk-core` version in lockstep with [Changesets](.changeset/config.json). Merging the version pull request publishes both packages to npmjs.com with provenance. Every merge to `main` also publishes a canary under the `canary` dist-tag:

```sh
npm install @usesimpler/sdk-core@canary
```

Publishing uses the `NPM_TOKEN` repository secret (an npm automation token that can publish `@usesimpler`) together with GitHub's OIDC token for provenance.

## Licence

[MIT](LICENSE). Integrators can ship the client inside proprietary applications.

## Report a vulnerability

Use a [private security advisory](https://github.com/usesimpler/sdk/security/advisories/new). See [SECURITY.md](SECURITY.md). Do not open a public issue for a security report.

## Issues

- SDK bug — the client or the schema package
- API issue — behaviour of the Integrator API surface
- Resource promotion request — ask for a resource on the Site surface or the Team integration surface

Maintainers follow [TRIAGE.md](TRIAGE.md) when a report needs server-side work.

## Pull requests

Every pull request needs a review from a maintainer in [CODEOWNERS](.github/CODEOWNERS) before it merges.

This repository's history starts here. Do not import commits from any other repository.
