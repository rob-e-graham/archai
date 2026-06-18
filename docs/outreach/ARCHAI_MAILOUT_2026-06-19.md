# ARCHAI Mail-out Pack - 19 June 2026

Author: Rob Graham / FAMTEC / RMIT University
Status: Send-ready working pack. Emails should be reviewed and sent individually.

## Purpose

This first mail-out has two related goals:

1. Invite open-source CMS/DAM communities to discuss technical integration and research collaboration.
2. Transparently notify the museums and aggregators whose public APIs or open collection data are represented in the ARCHAI research prototype.

ARCHAI should not be pitched as a replacement for a museum CMS or DAMS. It is a semantic, interpretive, and accessibility layer that connects to the institution's existing systems of record, whether those systems are hosted locally or in an approved cloud environment.

## Core Architecture Statement

ARCHAI is an open-source, local-first semantic interface layer for cultural institutions. It connects to existing collections management and digital asset management systems through governed APIs or network adapters, builds a rights-aware semantic index, and provides staff-facing collection intelligence and AUX.IO visitor experiences.

The preferred deployment is inside the institution's own network. Collection metadata, model inference, vector search, interaction logs, and future speech processing can remain under institutional control. The current research prototype runs on Apple silicon. A compact pilot can be scoped for Mac mini-class hardware with appropriately sized local models; larger collections or models can scale to a Mac Studio, GPU workstation, virtualised server, or institution-managed infrastructure.

The source CMS/DAMS remains canonical. ARCHAI stores only the fields and derived vectors approved for the project, preserves source identifiers and item-level rights, and can refresh or remove indexed records when source data changes.

## First-wave Contacts

### Technical and Open-source Partners

| Organisation | Contact route | Message | Status |
|---|---|---|---|
| CollectiveAccess | `info@collectiveaccess.org`; technical collaboration is listed publicly | Technical partnership email | Gmail draft |
| CollectionSpace / LYRASIS | `collectionspace@lyrasis.org` | Technical partnership email | Gmail draft |
| ResourceSpace | Official services enquiry form: `https://www.resourcespace.com/contact` | Short form version | Manual form |
| Omeka / Digital Scholar | Official partnership form: `https://omeka.org/contact/` | Short form version | Manual form |

### Source Institutions

| Institution/source | Contact route | ARCHAI use | Status / caution |
|---|---|---|---|
| The Metropolitan Museum of Art | `openaccess@metmuseum.org` | CC0 Open Access API records and images | Gmail draft |
| Art Institute of Chicago | `engineering@artic.edu` | Public API and public-domain image records | Gmail draft |
| Cleveland Museum of Art | `info@clevelandart.org` | Open Access API and CC0/public-domain records | Gmail draft; ask routing to digital/open access |
| Rijksmuseum | `collectieinfo@rijksmuseum.nl` | Collection data and public-domain/open records | Gmail draft |
| Te Papa Tongarewa | `digitaloutreach@tepapa.govt.nz`, `collections.api@tepapa.govt.nz` | Limited API-derived research subset | Gmail draft; explicitly ask about research caching/refresh requirements |
| Brasiliana Museus / Ibram | `cgsim@museus.gov.br` | Public-domain/open records from the aggregator | Gmail draft; bilingual opening |
| Museums Victoria | Research and collection enquiry form or a warm existing contact | CC BY API records | Manual/warm contact preferred |
| Victoria and Albert Museum | V&A API/contact route | Open collections records and IIIF images | Manual form |
| Europeana | Europeana Pro contact/data-reuse route | Rights-filtered aggregator records | Manual form until a current direct inbox is confirmed |
| Auckland Museum | Official contact/API route | Rights-filtered Linked Open Data records | Manual form |
| M+, Hong Kong | M+ API contact form | CC0 metadata and source-controlled preview media | Manual form |

## Shared Source-institution Email

Subject: ARCHAI PhD research prototype using [Institution] open collection data

Dear [Institution] Digital Collections / Open Access team,

My name is Rob Graham. I am a PhD researcher in Design at RMIT University and founder of FAMTEC in Melbourne. I am developing ARCHAI, an open-source, local-first research prototype that explores rights-aware semantic search, staff-facing collection interrogation, and AUX.IO visitor experiences for museums and galleries.

I am writing because the current research demo includes a small, rights-filtered subset of records from [Institution], accessed through [API / open data service]. I want to be transparent about that use, share what I am building, and invite your feedback before the project develops further.

ARCHAI is not intended to replace a collections management system or DAMS. It is designed as a semantic interface layer that can connect directly to an institution's existing CMS and DAMS, locally or through approved cloud APIs. The preferred deployment runs inside the institution's network so collection data, vector search, local AI inference, visitor interactions, and future speech services remain under institutional control. The current Apple-silicon prototype demonstrates that a pilot does not require large cloud infrastructure.

The source institution remains authoritative. ARCHAI preserves source links, identifiers, attribution, and item-level legal status wherever available. Public demo views are intended to show only media that passes the current rights gate. The prototype does not imply endorsement by [Institution], and I will promptly correct, relabel, restrict, or remove anything that your team identifies as unsuitable or inaccurate.

Project page: https://fineartmedia.tech/archai

GitHub: https://github.com/rob-e-graham/archai

White paper: attached

Would someone in your digital collections, open access, rights, research, or curatorial technology team be willing to review a short demonstration and let me know whether the attribution, rights handling, and framing are appropriate?

I would also welcome a conversation about future PhD research collaboration, pilot testing, accessibility evaluation, CMS/DAMS integration, or joint funding opportunities if the work aligns with your institution's priorities.

Warm regards,

Rob Graham
FAMTEC / RMIT University
rob@fineartmedia.tech
https://fineartmedia.tech

## Technical-partner Email

Subject: Open-source CMS/DAM integration research for ARCHAI

Dear [Project] team,

My name is Rob Graham. I am a PhD researcher in Design at RMIT University and founder of FAMTEC in Melbourne. I am developing ARCHAI, an open-source, local-first semantic interface layer for museums and galleries.

ARCHAI is deliberately not another collections management system or DAMS. It is intended to connect to systems such as [Project] through their APIs, remain inside an institution's network, and add a governed semantic index, conversational collection search, rights-aware publication controls, multilingual access, and AUX.IO object-level visitor experiences.

The source CMS/DAMS remains the system of record. ARCHAI can read approved metadata and asset derivatives, generate embeddings locally, preserve source identifiers and rights, and return visitors or staff to the canonical record. The current Apple-silicon prototype uses open-source components and demonstrates a compact deployment path that can scale from a pilot workstation to institution-managed server infrastructure.

I would value a conversation with your technical or community team about:

- the cleanest integration pattern for [Project]
- field mapping and incremental synchronisation
- rights, permissions, and derivative-media handling
- whether an open adapter could be useful to your community
- possible research, testing, or funding collaboration

Project page: https://fineartmedia.tech/archai

GitHub: https://github.com/rob-e-graham/archai

White paper: attached

Would someone from your project be open to a short technical discussion or demonstration?

Warm regards,

Rob Graham
FAMTEC / RMIT University
rob@fineartmedia.tech
https://fineartmedia.tech

## ResourceSpace Contact-form Version

I am an RMIT Design PhD researcher and founder of FAMTEC, developing ARCHAI: an open-source, local-first semantic interface layer for museums and galleries. ARCHAI is designed to sit above an existing DAMS/CMS rather than replace it. I am currently prototyping a ResourceSpace adapter so institutions can keep assets and permissions in ResourceSpace while ARCHAI adds local semantic search, rights-aware interpretation, and AUX.IO visitor access. I would value a short technical conversation about API integration, field mapping, approved derivatives, and whether an open connector could be useful to the ResourceSpace community. Project: https://fineartmedia.tech/archai GitHub: https://github.com/rob-e-graham/archai

## Omeka Contact-form Version

I am an RMIT Design PhD researcher and founder of FAMTEC, developing ARCHAI: an open-source, local-first semantic interface for museum and gallery collections. ARCHAI could sit above Omeka S as a governed semantic and conversational layer while Omeka remains the canonical publishing platform. I would value a conversation about an open integration, multilingual/accessible collection discovery, and possible research or community collaboration. Project: https://fineartmedia.tech/archai GitHub: https://github.com/rob-e-graham/archai

## Te Papa-specific Addition

Add after the source-use paragraph:

> I have also noted Te Papa's guidance that API content should not be cached for more than four weeks. Because ARCHAI builds a local semantic research index, I would particularly value your advice on an acceptable refresh cycle or whether separate written permission would be appropriate for a limited doctoral research cache. Until that is clarified, I will treat Te Papa records as a refresh-controlled research subset and preserve the API's item-level legal, moral, and cultural status.

## Brasiliana-specific Opening (Portuguese + English)

Prezada equipe Brasiliana Museus / Ibram,

Meu nome é Rob Graham. Sou pesquisador de doutorado em Design na RMIT University, em Melbourne, e fundador da FAMTEC. Estou desenvolvendo o ARCHAI, um protótipo de pesquisa de código aberto e infraestrutura local para busca semântica, acesso interpretativo e interfaces de visitantes para museus.

Escrevo em inglês abaixo para evitar a introdução de erros por meio de tradução automática, mas ficarei muito feliz em continuar a conversa em português com apoio de tradução.

Then continue with the shared source-institution email.

## The Larger Research Direction

The longer-term concept is not a centralised "world museum" that copies and owns everyone's collections. A more defensible direction is a federated World Museum Research Graph:

- institutions remain authoritative and retain governance over their records
- ARCHAI indexes only permitted fields and derivatives
- every result retains provenance, source links, rights, and cultural protocol information
- participating institutions can run local nodes or expose approved APIs
- cross-collection analysis operates over a federated semantic layer
- sensitive, restricted, or community-controlled knowledge can remain local or excluded
- researchers can compare materials, periods, technologies, movements, makers, and histories across institutional boundaries

This should be introduced after trust is established, not as the headline of the first transparency email.

## Sending Sequence

1. Review all Gmail drafts and confirm the attached paper is the correct public version.
2. Send technical-partner messages first: CollectiveAccess, CollectionSpace, then ResourceSpace form.
3. Send source-institution messages individually in this order: Met, AIC, CMA, Rijksmuseum, Te Papa, Brasiliana.
4. Use warm contacts or official forms for Museums Victoria, V&A, Europeana, Auckland Museum, and M+.
5. Log every send date in `OUTREACH_TRACKER.md`.
6. Follow up once after 10-14 days.
7. Route any rights or correction request ahead of partnership discussion.

## Verification Sources

- CollectiveAccess public contact page: https://collectiveaccess.org/contact/
- CollectionSpace public contact page: https://collectionspace.org/contact/
- ResourceSpace public contact and FAQ pages: https://www.resourcespace.com/contact and https://www.resourcespace.com/faq
- Omeka partnership contact page: https://omeka.org/contact/
- The Met Open Access page: https://www.metmuseum.org/about-the-met/policies-and-documents/open-access
- Art Institute of Chicago API documentation: https://api.artic.edu/docs/
- Cleveland Museum of Art Open Access and contact pages: https://www.clevelandart.org/open-access-faqs and https://www.clevelandart.org/contact-us
- Rijksmuseum Data Services: https://data.rijksmuseum.nl/docs/oai-pmh/
- Te Papa Collections API and terms: https://www.tepapa.govt.nz/collections-api-new and https://www.tepapa.govt.nz/api-terms-of-use
- V&A Collections Data: https://developers.vam.ac.uk/
- Auckland Museum API: https://api.aucklandmuseum.com/
- M+ API documentation: https://api.mplus.org.hk/en/documentation/about
- Brasiliana Museus contact page: https://brasiliana.museus.gov.br/contato/
