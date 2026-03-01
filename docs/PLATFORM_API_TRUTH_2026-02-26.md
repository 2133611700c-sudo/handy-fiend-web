# Platform API Truth (Verified on 2026-02-26)

## Thumbtack
- Pro page: https://www.thumbtack.com/pro
- Partner developer docs: https://developers.thumbtack.com/docs
- Access request: https://developers.thumbtack.com/request-access
- Negotiations (Leads) API: https://developers.thumbtack.com/docs/negotiations/implementation
- Fact: Official API exists, OAuth + webhook flow, access is partner-gated.

## Taskrabbit / Tasker
- Developer hub: https://developer.taskrabbit.com/
- Getting started: https://developer.taskrabbit.com/docs/getting-started
- Fact: Taskrabbit Home Services API is marked as not publicly ready in docs (coming soon language in getting started section). Delivery/Dolly API exists for approved access.

## Nextdoor
- Business center: https://business.nextdoor.com/
- Developer portal: https://developer.nextdoor.com/
- Publish API intro: https://developer.nextdoor.com/reference/sharing-introduction
- Conversion API getting started: https://developer.nextdoor.com/reference/conversion-getting-started
- Fact: Publish + Ads/Conversion APIs exist, require application/access token workflow.

## Craigslist
- Sites listing: https://www.craigslist.org/about/sites
- Bulk posting interface: https://www.craigslist.org/about/bulk_posting_interface
- Bulk docs v1: https://bapi.craigslist.org/bulkpost-docs/v1/
- Fact: No general public self-serve API for everyone. Bulk posting is restricted (case-by-case, high-volume and specific categories).

## Can we post ads by API keys right now?
- Thumbtack: only after partner approval and OAuth app setup.
- Taskrabbit: not for general public home-services posting right now.
- Nextdoor: possible after access approval + OAuth/token setup.
- Craigslist: restricted bulk interface, not universal open posting API.
