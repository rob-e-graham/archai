# EaaSI Integration Boundary

## Why EaaSI belongs beside ARCHAI

EaaSI is an emulation curation and access system for creating, managing, and using emulated computers, software, and digital information. It is not a general museum-object API and should not be treated as another harvesting source.

ARCHAI's role is to connect a canonical collection object to one or more governed manifestations. For a software-dependent work, an `emulation` manifestation can reference the institution's EaaSI environment and content identifiers while ARCHAI retains the collection context, curatorial interpretation, rights review, and access policy.

## Proposed boundary

```text
CMS / DAMS canonical object
        |
        v
ARCHAI emulation manifestation
  - EaaSI tenant ID
  - environment ID
  - content/software IDs
  - rights and cultural protocol
  - staff/public access policy
        |
        v
Institutional EaaSI node
  - environment management
  - disk images and software
  - compute/session provisioning
  - controlled browser session
```

ARCHAI must never copy an EaaSI token into a generated AUX.IO page. Session launch should be mediated by the backend after checking the manifestation's publication state, rights, role, and institutional access policy.

## Network discovery

EaaSI installations include an OAI-PMH harvester and provider for sharing metadata between trusted nodes. ARCHAI can use a configured node's OAI-PMH provider for discovery and reconciliation without treating shared software or environments as automatically publishable.

The initial adapter exposes health/configuration only:

- `EAASI_BASE_URL`
- `EAASI_OAI_URL`
- `EAASI_API_TOKEN`
- `EAASI_TENANT_ID`

`GET /api/integrations` reports whether the OAI-PMH endpoint responds to `Identify`. It deliberately does not invent a session-launch URL because that contract depends on the deployed EaaSI version, tenant, authentication, and local policy.

## Manifestation metadata

An ARCHAI `emulation` manifestation should eventually carry:

```json
{
  "provider": "eaasi",
  "tenantId": "institution-tenant",
  "environmentId": "environment-id",
  "contentId": "content-id",
  "softwareId": "optional-software-id",
  "accessPolicy": "staff_review"
}
```

This reference belongs alongside, not inside, the canonical source metadata. Preservation packages and EaaSI environments remain under institutional control.

## Safe implementation sequence

1. Partner with an EaaSI member institution or deploy an institutional test node.
2. Confirm its supported API/session-launch contract and authentication model.
3. Map EaaSI environment/content metadata to ARCHAI manifestations.
4. Add staff reconciliation and rights-review UI.
5. Launch sessions only through a backend policy gate.
6. Test read-only sessions, timeouts, accessibility, privacy, and cleanup.
7. Offer public AUX.IO launch only where collection, software, and access rights are cleared.

## Partnership direction

The EaaSI Research Alliance is an international community of libraries, archives, and museums focused on responsible browser-based access to software-dependent collections and virtual reading-room use cases. The strongest next move is a research/technical conversation with the Software Preservation Network and an Alliance institution, rather than attempting to join or scrape a trusted network without an institutional agreement.

## Authoritative references

- EaaSI Operations Handbook, "What Is EaaSI?": https://eaasi.gitlab.io/program_docs/eaasi-operations-handbook/charter/what-is-eaasi.html
- EaaSI Research Alliance: https://www.softwarepreservationnetwork.org/eaasi-research-alliance/
- EaaSI emulation workshop and sandbox: https://eaasi.gitlab.io/program_docs/intro-emulation-workshop/06-eaasi/index.html
