# Contemporary, Born-Digital, and Street Art Source Audit

Checked: 22 June 2026

## Decision rule

ARCHAI assesses metadata and media separately. An open metadata dataset is not an open image collection, and public access to an artwork is not permission to archive, embed, exhibit, or republish it.

| Source | What is usable now | What is not cleared | ARCHAI decision |
|---|---|---|---|
| Smithsonian Open Access | Item-level assets explicitly designated CC0, plus associated open metadata | Records or media carrying usage conditions, contractual restrictions, cultural sensitivity, or no CC0 designation | Strong next harvester, but ingest only item-level CC0 assets |
| National Gallery of Art | CC0 metadata and IIIF images explicitly marked `openaccess=1` | Images marked `openaccess=0` are fair-use display derivatives | Approved; strict item-level harvester implemented |
| MoMA collection dataset | Collection metadata under CC0 | Images are expressly excluded from the dataset licence | Metadata/interrogation candidate; metadata-only public cards unless separately licensed media exists |
| Whitney Open Access | Public dataset/API metadata under CC0 | Do not infer that every artwork image or digital work is CC0 from the metadata licence | Metadata candidate; verify item-level media and terms before any thumbnail or replay |
| Tate collection dataset | Historical 2014 metadata snapshot under CC0 | Images are excluded; dataset is no longer maintained | Research/enrichment source only, not a current image-backed demo collection |
| Rhizome ArtBase | Research partnership, linked-data study, and permissioned collaboration | Artworks and images are presumed copyrighted; exhibition/republication needs artist permission and sometimes Rhizome approval | Partnership target, not an automatic harvester |
| Street Art Cities | Monthly JSON/CSV metadata for academic analysis, subject to its acceptable-use terms | Images are excluded; non-academic redistribution or integration requires express consent | Research-partnership target; do not add to the public demo without written permission |
| RapidAPI and unofficial wrappers | Endpoint discovery only | Source authority, upstream consent, record provenance, and item-level media rights are not established by a wrapper listing | Do not integrate until verified directly with the originating collection |
| Art UK street-art discovery | Potential institutional partnership and linked-record research | A secondary article is not an API or media licence | Contact Art UK and verify official access and item-level image terms first |

## Street art specifically

Useful street-art data can come from several classes of source:

1. Artist- or collective-maintained archives
2. Municipal public-art registers and commissioned-art datasets
3. Museum or gallery street-art collections
4. Community mapping platforms
5. Wikimedia Commons categories with per-file licences

The best first source is usually a municipal commissioned-public-art register because the commissioning body can often provide stable identifiers, artist attribution, location history, and explicit media terms. Even then, each image may have a separate photographer licence.

Street Art Cities publishes official monthly JSON and CSV metadata exports for academic analysis. Its acceptable-use statement says that non-academic redistribution or integration requires express consent, and the standard exports deliberately exclude hunter images. ARCHAI can explore the metadata within a documented RMIT research context, but a public website integration should wait for a written research/data partnership and must not infer image rights from the metadata feed.

Street Art Cities' contributor terms separately describe uploaded images and descriptions as CC BY-SA 4.0. That does not override the open-data feed's explicit exclusion of images or remove the need to preserve photographer attribution, artist rights, and platform terms at item level. The safe route is a direct partnership and an agreed machine-readable rights payload.

For any street-art record, preserve:

- artist and aliases
- artwork title, date, and status
- photographer and image licence
- commissioning body or property context
- current, removed, overpainted, damaged, or unknown status
- location precision and any safety restriction
- source URL and retrieval date
- artist/community cultural protocol
- takedown and correction contact

## Born-digital partnership opportunity

Rhizome is the strongest methodological and partnership lead. ArtBase already distinguishes a work from its variants, including external links, hosted copies, web archives, emulated instances, and documentation. Rhizome also explicitly welcomes collaborative research and joint grant development.

ARCHAI should approach Rhizome to discuss:

- interoperable manifestation/variant metadata
- local sovereign replay of institution-owned captures
- WACZ and emulation provenance
- semantic discovery across born-digital archives
- accessibility and interpretation layers
- an RMIT-linked research collaboration rather than content copying

Contact published by Rhizome for research partnerships: `research@rhizome.org`.

## Safe modern-art onboarding order

1. Smithsonian item-level CC0 media and metadata
2. National Gallery of Art item-level open-access IIIF media and CC0 metadata
3. MoMA CC0 metadata, with no copied artwork images
4. Whitney CC0 metadata after confirming API implementation details
5. Direct artist/institution permissioned born-digital pilot
6. Rhizome research partnership
7. Municipal street-art/open-public-art partnership

This order adds modern and born-digital depth without weakening ARCHAI's rights-aware foundation.

## Authoritative references

- Smithsonian Open Access FAQ and API: https://www.si.edu/openaccess
- Smithsonian Terms of Use: https://www.si.edu/termsofuse
- National Gallery of Art Open Data: https://github.com/NationalGalleryOfArt/opendata
- MoMA collection dataset: https://github.com/MuseumofModernArt/collection
- Whitney Open Access: https://whitney.org/open-access
- Tate collection dataset: https://github.com/tategallery/collection
- Rhizome ArtBase FAQ: https://artbase.rhizome.org/wiki/FAQ
- Rhizome ArtBase About: https://artbase.rhizome.org/wiki/About
- Rhizome ArtBase User Guide: https://artbase.rhizome.org/wiki/User%20Guide
- Street Art Cities About: https://streetartcities.com/about
- Street Art Cities Open Data and acceptable use: https://streetartcities.com/open-data
- Street Art Cities contributor terms: https://streetartcities.com/legal/hunter
- WACZ specification: https://specs.webrecorder.net/wacz/1.1.1/
- ReplayWeb.page embedding: https://replayweb.page/docs/embedding/
- Browsertrix documentation: https://docs.browsertrix.com/
