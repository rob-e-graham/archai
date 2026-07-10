# ARCHAI — Spatial Awareness & Wayfinding

**Status:** Design exploration (pre-implementation)
**Last updated:** 10 July 2026
**Companion to:** `ARCHAI_DATA_RESIDENCY_POLICY.md`, `ROADMAP.md`

---

## 1. The idea

Today ARCHAI makes an object speak. The next step is to make the **building
navigable in conversation** — so a visitor can ask "where is the Rodin?", "how
do I get to the café?", "what's around me?", or "give me the highlights in
thirty minutes", and ARCHAI answers as a guide that actually knows the place.

This turns ARCHAI from an object-level interpreter into a **sovereign,
accessible tour guide and wayfinder** — one that helps people *find things*, not
just learn about them, and does it without a camera watching them or a cloud
maps API tracking them.

*From "the object speaks" to "the building can guide you."*

---

## 2. Design principles

1. **Wayfinding is routed, not guessed.** Directions come from a *verified
   spatial graph* via deterministic pathfinding. The language model narrates the
   computed route; it never invents directions. A lost visitor sent the wrong
   way is a real failure, so this is the epistemic-integrity principle (an object
   declines rather than infers) applied to space. If a place isn't mapped, ARCHAI
   says so and points to the nearest staff or sign.
2. **Universal baseline, richer by choice.** The core must work on any phone via
   a web page, offline, with no download — so a regional gallery and a visitor
   with a five-year-old Android are never excluded. Better hardware adds fidelity;
   it is never required.
3. **Sovereign and unsurveilled.** The building's map is the institution's own
   data on its own hardware. No cloud indoor-maps API, no continuous tracking of
   a person, no images leaving the device. Check-ins are deliberate.
4. **Accessibility is a first-class use case, not a mode.** Surroundings
   narration and step-free routing are core, because a guide that can describe
   what's around you is transformative for low-vision and first-time visitors.
5. **Honest about coverage.** A partially-mapped building is normal. ARCHAI works
   with whatever is mapped and is plain about the edges.

---

## 3. The spatial map model

"The map of a building" is a graph the model can reason over — and crucially it
includes **amenities and landmarks**, not just collection objects, because
finding the toilet, the lift, or the exit is half of what people ask.

```
node: {
  id, label,
  type: object | gallery | exit | restroom | cafe | lift | stairs |
        info_desk | cloakroom | seating | entrance,
  floor, zone,
  x, y,                     // coarse coordinates (or gallery + wall)
  aux_id?,                  // links to the AUXIO object page if it's an object
  accessible: true|false    // e.g. is this reachable step-free
}

edge: {
  from, to,
  direction,                // N/E/S/W or relative, if known
  distance,                 // rough metres or "steps"
  via: archway | hall | stairs | lift | door,
  step_free: true|false     // for accessible routing
}

position: last check-in node   (+ facing, if compass/LiDAR available)
```

Multi-floor is handled by `floor` plus `stairs`/`lift` edges, so routing can go
vertical and prefer step-free paths when needed.

### Where the map comes from (cheapest first)

1. **Authored** — staff place the tags and sketch a simple plan once: zones,
   adjacencies, amenities, rough coordinates. Works day one, no special hardware.
2. **Learned** — aggregate *anonymous* check-in sequences ("people who tapped A
   next tapped B") to infer adjacency and popular paths. Emergent, zero extra
   effort, no personal tracking.
3. **Imported** — the institution's existing wayfinding floor plan.
4. **Scanned** — LiDAR / ARKit RoomPlan auto-generates geometry where available.

ARCHAI consults whatever map exists; each source raises fidelity without changing
the interface.

---

## 4. The sensing stack (baseline never breaks)

| Tier | Sensor | Gives the model | Reach |
|---|---|---|---|
| **0 — baseline** | **NFC / QR check-in** | "You are at node X" | Any phone, web, offline, private |
| 1 | Phone compass + motion | Facing → true left/right | Almost any phone |
| 2 | BLE beacons (optional) | Rough proximity between anchors | Cheap add-on |
| 3 | LiDAR / ARKit (RoomPlan) | Live 3D geometry, real distances, auto floor plan | Pro iPhone/iPad, native app |

**On LiDAR specifically:** genuinely powerful (true position, real distances,
auto floor plans, superb for accessibility narration), but Apple-only, app-only,
and heavier — so it is an optional top tier for capable devices, never the
baseline. Kept on-device, it still respects the sovereignty line. NFC/QR remains
the universal, sovereign floor everyone gets.

---

## 5. What ARCHAI can then do

1. **Findability (reactive).** "Where's the Rodin / the toilet / the café / the
   exit?" → route over the graph from the current node → narrate the path.
2. **Guided tours (proactive).** "Highlights in 30 minutes", "a tour about
   colour", "something for a restless 7-year-old" → plan a path over relevant
   nodes fit to time and interest (fusing the physical graph with Qdrant semantic
   similarity), then guide and interpret stop by stop.
3. **Surroundings narration (accessibility).** "What's around me?" → nearby nodes
   with bearings and distances: "You're before [object]; behind you is [object];
   through the archway on your right is [gallery]; nearest seating is a few steps
   back."
4. **Journey memory.** Deliberate check-ins form a personal thread: "You've seen
   these six; based on what you lingered on, you'd probably like [next], two rooms
   over."

---

## 6. Wayfinding, grounded in the graph

The safety-critical part. The model must not free-hand directions.

```
ask ("where is X?")
  → resolve X to a node
  → shortest path from current node over verified edges (Dijkstra/A*),
    respecting step_free when accessibility is requested
  → the model narrates ONLY that computed path, relative to facing if known,
    else via named landmarks
  → if no path / X unmapped: say so plainly, offer nearest staff or the
    printed map. Never guess.
```

Physical + semantic fusion: NFC/QR gives *where you are*; Qdrant gives *what's
related*. "The work beside you is physically next to you; something thematically
close sits two galleries over — want me to route you there?"

---

## 7. Architecture in ARCHAI terms

Builds directly on what exists (AUXIO, `aux-id-map`, the grounded chat, Qdrant):

- **Extend the tag registry** (`aux-id-map` / `nfc-pages`) with the `node`
  spatial fields above; add a `spatial_map.json` holding the edge graph +
  amenity nodes.
- **Spatial-context builder** — turn a check-in (+ last N check-ins + facing)
  into a short system-prompt fragment for the existing grounded chat.
- **Router** — deterministic shortest-path over the graph; the model narrates
  its output, keeping directions verifiable (mirrors `buildNfcPageModel`'s
  record-grounding for objects).
- **Tour planner** — select-and-order nodes by interest (Qdrant) + time budget,
  return an ordered path the router stitches together.
- All of it runs locally, alongside Ollama + Qdrant. No new cloud dependency.

---

## 8. Phased plan

- **Phase 0 — prove it, no new hardware.** Authored map for *one gallery* +
  QR/NFC check-in → the model narrates surroundings and answers "where is X?" by
  routing over the small graph. Validates the whole idea end to end.
- **Phase 1 — orientation.** Add phone compass so left/right is exact; add
  amenity nodes (toilet/café/exit/lift) so "help me find things" is real.
- **Phase 2 — tours.** Time-boxed, interest-driven guided tours fusing the graph
  with Qdrant; journey memory.
- **Phase 3 — richer sensing (optional).** BLE proximity; a LiDAR/ARKit mode on
  capable devices for accessibility narration and AR; a continuous-read device
  (wearable / kiosk-on-wheels) for the ambient "eyes" mode.
- **Beyond the walls.** The same tag on a street poster carries identity plus a
  coarse locale, so wayfinding scales from a gallery to a trail across a city.

---

## 9. Open questions

- Authoring UX: the lightest possible way for a two-person team to draw the map
  and place tags (a simple in-app map editor on top of the Connect flow?).
- Orientation without compass/LiDAR: is "facing = direction of last movement"
  good enough for relative directions in most galleries?
- Privacy of the *learned* map: aggregate-only, k-anonymity thresholds, and no
  per-visitor path retained beyond the session.
- Accessible routing defaults and how communities/curators set them.

---

## 10. Why this is still ARCHAI

It answers "who is my guide, and who is watching me while it guides me?" the same
way ARCHAI answers everything else: locally, openly, and on the institution's own
terms. A building that can guide you without a cloud maps API tracking you, on any
phone, free at the point someone walks in — the eyes that don't watch you back,
extended from the object to the whole room.

*Sovereign by default. Connected by choice.*
