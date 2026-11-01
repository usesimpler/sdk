# Triage

This repository is the public intake for the Simpler API client and the Integrator API surface. Integrators use one of three issue templates.

| Template | What happens |
| --- | --- |
| SDK bug | Fixed in this repository. |
| API issue | Server-side work is tracked in Linear. Status stays on the public issue. |
| Resource promotion request | Server-side work is tracked in Linear. The request stays on the public issue until the resource is on an integrator surface. |

## Moving server-side work to Linear

API issues and resource promotion requests need work that does not live in this repository. A maintainer opens a Linear issue and keeps the private tracker private.

The Linear issue contains:

- The public GitHub issue URL
- A restatement, in product language, of the integrator-visible request: which integrator surface (Site surface or Team integration surface), which resource, and what the integrator needs to do

The Linear issue and any public comment must not contain:

- Paths, unpublished schemas, database details, or stack traces from outside this repository
- A Linear URL. Those URLs include the issue title, so pasting one publishes the private title

On the public issue:

1. Add the `triage:server` label.
2. Comment: "This needs a change on the API. We are tracking it internally and will update this issue when it ships."
3. When the API change ships, comment with the public behaviour change and close the issue if nothing remains.

An SDK bug stays labelled `sdk` and is fixed here. If it turns out to be an API bug, triage it as an API issue from that point.
