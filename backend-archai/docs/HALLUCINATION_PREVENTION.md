# Hallucination Prevention Framework (Implemented Scaffold Version)

This scaffold includes a practical starter implementation of the five-layer model described in the ARCHAI research.

## Five layers (implementation mapping)

1. Metadata boundary
- Object chat only runs when a specific object record is supplied
- No general chatbot mode in object endpoint
- File: `src/services/hallucinationGuard.js`

2. Verified facts required
- Object response is grounded in `verifiedFacts[]`
- Guard can block responses when verified facts are missing
- File: `src/services/hallucinationGuard.js`

3. Explicit unknowns
- `unknownFields[]` are inserted into the bounded system prompt
- Model is instructed to acknowledge unknowns directly
- Files: `src/services/hallucinationGuard.js`, `src/routes/chat.js`

4. Prohibited claims filter
- `prohibitedStatements[]` are included in system prompt constraints
- Future production step: add response classifier / regex + semantic post-check
- Files: `src/services/hallucinationGuard.js`, `src/routes/chat.js`

5. Provenance logging
- Every chat response builds a provenance record with source IDs + model used
- File: `src/services/provenanceService.js`

## Current behavior

- `POST /api/chat/object` performs guard evaluation before calling the chat adapter
- If blocked, returns a safe fallback response and reasons
- If allowed, returns response + guard status + provenance trace

## Production upgrades to add next

- Retrieval chunk provenance (field-level, document-level citations)
- Post-generation validation against fact triples
- Restricted phrase/entity detector
- Response moderation queue for sensitive objects
- Signed provenance logs / tamper-evident event stream
