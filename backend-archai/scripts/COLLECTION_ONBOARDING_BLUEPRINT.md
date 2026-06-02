# ARCHAI Collection Onboarding Blueprint

This note keeps collection onboarding clean, fast, and aligned with the ARCHAI white paper.

## Principle

Onboarding is not just “harvest and dump into Qdrant”.

Every new collection should enter ARCHAI through five layers:

1. `Raw source record`
The original museum payload exactly as delivered by the source API or dataset.

2. `Canonical metadata`
A normalized object schema shared across all institutions.

3. `Display and language layer`
Human-facing text for ARCHAI and AUX.IO.

4. `Embedding layer`
Search text and vectors derived from canonical and display data.

5. `Interaction layer`
Curator notes, visitor comments, response-tone logic, and chat outputs.

## Non-negotiable rules

- Never overwrite or rewrite the raw source record.
- Never mix generated interpretation back into source metadata.
- Prefer institution-supplied translations first.
- Only machine-translate missing fields.
- Keep rights, cultural protocol, and source provenance attached to every object.
- Keep translation data derived, replaceable, and documented.

## Translation baked into onboarding

Translation belongs in onboarding and enrichment, not mainly in live chat.

Why:

- faster object pages
- faster collection search
- faster AUX.IO
- lower repeated LLM cost
- clearer provenance
- easier review by curators and collections staff

## Canonical metadata target

Every new harvester should aim to output these core fields where possible:

- `canonical_id`
- `source`
- `source_record_id`
- `source_institution`
- `source_country`
- `source_language`
- `available_languages`
- `title`
- `object_type`
- `discipline`
- `category`
- `date_range`
- `registration_number`
- `museum_location`
- `description`
- `medium`
- `artist`
- `culture`
- `period`
- `dimensions`
- `licence`
- `source_url`
- `media_thumbnail`
- `media_medium`
- `media_large`
- `embedding_text`

## Translation-aware payload additions

When the source includes multilingual content, preserve it directly:

- `title_translations`
- `description_translations`
- `creator_translations`
- `medium_translations`
- `subject_translations`
- `display_texts`
- `translation_status`
- `translation_ready`

### Translation status values

- `source_multilingual`
- `source_single_language`
- `machine_enriched`
- `translation_pending`

## Recommended onboarding flow

1. Confirm source legality
Check API terms, item-level rights, image rules, and cultural sensitivity notes.

2. Harvest raw record
Save the source payload unchanged for audit and reprocessing.

3. Normalize to canonical shape
Map the institution schema into ARCHAI’s shared metadata shape.

4. Preserve source language fields
Keep multilingual values exactly if the source already provides them.

5. Generate missing display translations
Only for approved languages and only where the source does not provide them.

6. Build embedding text
Prefer clean canonical and display text, not raw nested JSON.

7. Upsert to Qdrant
Keep vectors lightweight and useful for search.

8. Regenerate AUX.IO pages
Only after the canonical/display layer is stable.

## Immediate target regions

Priority should favour balance, not just scale.

Use the legal / quality gate matrix before starting any new harvester:

- [INTERNATIONAL_ONBOARDING_MATRIX.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/INTERNATIONAL_ONBOARDING_MATRIX.md)
- [collection-targets.json](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/backend-archai/scripts/collection-targets.json)

### Australia / Aotearoa / Pacific

- Te Papa
- Auckland Museum
- DigitalNZ
- QAGOMA
- National Museum of Australia
- WA Museum

### Asia

- M+
- Tokyo Museum Collection API
- National Palace Museum
- National Taiwan Museum of Fine Arts

### South America

- Brasiliana Museus

### Middle East

- Qatar Museums
- Qatar Digital Library

### Specialist / technology

- Computer History Museum
- Trove

## What ARCHAI should read from

ARCHAI and AUX.IO should prefer:

1. canonical fields
2. stored display texts
3. approved translations
4. only then live model behaviour

This keeps the interface fast and consistent.

## What not to do

- Do not translate the full record ad hoc in the browser for every view.
- Do not depend on live translation to make a record legible.
- Do not flatten culturally sensitive metadata into generic text.
- Do not treat rights metadata as optional.

## Current implementation start

Europeana is the first collection in this repo now carrying explicit multilingual-preservation support in the harvester payload.

That should become the pattern for future onboarding.
