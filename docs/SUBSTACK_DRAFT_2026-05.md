# Cultivating a Living Archive

*I built ARCHAI™ from scratch on a Mac, with local AI, Claude, Codex, and a stubborn belief that museum collections should be able to speak without giving themselves away.*

I want to start with the thing itself, not the theory.

Here are three little object pages from the current ARCHAI NFC build:

[Jacques-Louis David's 1788 portrait of Antoine Laurent Lavoisier and Marie Anne Lavoisier](https://fineartmedia.tech/nfc-pages/v/NFC120.html), built from public-domain collection data from The Metropolitan Museum of Art.

[Dynatron TV23A Falcon](https://fineartmedia.tech/nfc-pages/v/NFC010.html), a 1949 television from the Victoria and Albert Museum collection.

[Coin - Guinea, Charles II, Great Britain, 1679](https://fineartmedia.tech/nfc-pages/v/NFC046.html), a Museums Victoria object with a compact but surprisingly rich historical record.

They are not finished products. They are not slick museum interactives. They are working fragments: phone-sized object pages with an image where one exists, a verified record, a source link, related objects, share controls, a visitor response box, and a small conversational interface that lets the object answer from its own metadata.

That is enough to show the shape of the idea.

What if every object in a collection could become a doorway like this?

Not a chatbot pretending to be alive. Not a vendor kiosk with a museum skin. Not another cloud service quietly collecting visitor conversations somewhere the institution cannot see. Just a page, a record, a model, and a boundary around what the object can honestly say.

That boundary matters. A collection object should be allowed to say, in effect: this is what my record knows; this is what it does not know.

That is the heart of ARCHAI.

Making the depth of the archive available at the moment curiosity appears.

## How I got here

ARCHAI did not appear because I wanted to make a museum chatbot.

It came out of years of working around cultural technology and seeing the same pattern again and again: beautiful collections trapped behind systems that did not really talk to each other; public interfaces that showed only a thin slice of what the institution knew; digital projects arriving as vendor packages; strategy slowly becoming dependence on someone else's platform.

The knowledge was there. The care was there. The records were there. The people were there.

But the interface between people, objects, data, and institutional memory was too thin.

While writing my PhD application, that frustration started turning into a research direction: an open-source, sovereign, semantic AI toolkit for GLAM institutions. Not a chatbot bolted onto a collection website. Not a cloud service wearing a museum badge. A tool that institutions could own, inspect, adapt, and run themselves.

Writing the application gave the ideas shape. Writing the code tested whether they could stand up.

When I started the PhD in late February and early March 2026, I began using Claude and Codex deliberately to test new ways of building and coding. Not to outsource the idea. More like studio tools. I wanted to see whether AI coding systems could help me turn a theoretical research direction into solid, inspectable, working code.

So I started building.

At first it was local HTML experiments and a question I could not leave alone. Then a browser interface. Then a vector database. Then local language models. Then NFC pages. Then a backend proxy. Then comments. Then moderation. Then a PWA. Then conversational search.

At some point I looked up and realised I was no longer sketching an idea.

I was maintaining infrastructure.

The criticism is the thing I made.

## What ARCHAI is, in plain language

ARCHAI is an open-source, local-first AI toolkit for cultural heritage collections.

It runs on a Mac Studio in my current development setup. It uses Qdrant for vector search, Ollama for local language models, Node/Express for the backend, SQLite for visitor comments, and ordinary browser pages for the interface. The current prototype searches across Museums Victoria, The Met, and the V&A.

The point is not that this is the biggest possible system. It is not.

The point is that it works without handing the archive to a platform.

That is the punk bit, really. Own the machine. Own the model. Own the conversation.

Museums should not have to rent their own memory back from a cloud provider.

The code is published under MPL-2.0, open enough to inspect, fork, repair, and adapt, while still protecting the ARCHAI™ name and the research context around it. That feels important to me. Open source should not mean careless. Especially not with cultural material.

## Objects speaking, carefully

The old word at the centre of this is *prosopopoeia*: giving voice to something silent.

I love that this supposedly new problem has an ancient root. People have always wanted objects, places, and absent voices to speak. The difference here is that a museum object cannot just say whatever a story needs it to say. It has to stay inside its record.

So ARCHAI asks objects to speak from verified metadata. If the data is thin, the answer should be thin. If the record does not know something, the object should say so. That is not a failure of the system. That is archival honesty.

I have been calling the structured object context **Obtext**: object context in a form both humans and AI can read. It can hold identity, physical properties, dates, significance, media links, related people and objects, and also constraints: what the object should not claim to know.

That is what lets the conversation travel. You might open the Lavoisier page in the article, save the object context, and later keep learning at home: following the source record, asking another question, comparing related objects, or sharing the trail with a class or a friend.

The museum remains the source of authority.

The conversation can travel, but the evidence boundary travels with it.

## What changed in the latest build

The new version is less of a demo and more of a small working stack.

There is now a backend proxy, so public access does not mean exposing Ollama or Qdrant directly. There is rate limiting, prompt-injection blocking, schema validation, and token limits. There are AI-moderated visitor comments, where safe responses can appear and suspicious or harmful ones go to curator review. There is a curator vector collection that combines object metadata with reviewed contributions so staff can search across records and public memory together.

And there is conversational search.

That one still feels a bit electric to me. Instead of typing keywords and getting a list, you ask the collection a question in normal language. The system searches semantically, retrieves relevant objects, and then answers with those objects as evidence. You still see the cards. You still see the objects. But the database has started to talk back.

Again, carefully.

Always with the objects visible underneath.

## Why sovereignty matters

The museum sector is being sold AI at speed. Some of it is useful. Some of it is shiny nonsense. A lot of it asks institutions to send collection data, visitor data, or interpretive work into systems they do not own and cannot properly inspect.

That is not a small detail.

If a museum cannot control the machine that mediates its own collection, it has given away something deeper than a software contract. It has given away part of the relationship between the public and cultural memory.

ARCHAI is my counter-proposal. Small machine. Local model. Open code. Visible records. Human authority.

Not anti-technology.

Anti-lock-in.

Not anti-institution.

Anti-dependence.

I do not think every museum needs to become a software company. But I do think cultural institutions need tools they can understand, repair, refuse, and reshape.

## Visitor knowledge matters too

There is another part of this that keeps pulling at me.

Visitors know things.

Someone sees an object and remembers a parent using one. Someone recognises a tool from a factory. Someone hears a song in a lantern slide. Someone knows why an object mattered in a household, a suburb, a scene, a community.

Most of that knowledge disappears.

ARCHAI treats visitor responses as a possible contribution layer, not as instant truth. A visitor comment should not rewrite the collection record. But with consent, attribution, moderation, and curator review, it can sit beside the record as dated, reviewable cultural evidence.

That is what I mean by a living archive. Not chaos. Not the public overwriting the institution. A conversation between institutional memory and public memory, with the boundary visible.

## What this does not solve

I do not want to oversell this.

ARCHAI does not replace curators. It does not solve cultural sensitivity by itself. It does not magically preserve embodied experience, community authority, or time-based work just because it has a vector database attached.

A local system still needs maintenance. It needs backups. It needs people who understand what it is doing. Sensitive material needs governance before it ever enters an AI pipeline. Visitor contributions need consent, retention rules, and removal pathways.

That is why I keep calling ARCHAI infrastructure, not automation.

The goal is not to make culture frictionless.

The goal is to make cultural knowledge more discoverable while keeping authority, uncertainty, and responsibility visible.

## Where this is going

Next, I want to keep growing the object pages into a fuller AUX experience: NFC, QR, links, maybe beacons later, all pointing into the same object context. I want Obtext to become more formal. I want conversational search to get sharper. I want multimodal search: image, colour, sound, maybe gesture. I want institutions to be able to run this themselves without needing a cloud subscription or a magic priesthood.

This is doctoral research, but it is also a working build.

That feels important.

The repository is here: [github.com/rob-e-graham/archai](https://github.com/rob-e-graham/archai)

The project page is here: [fineartmedia.tech/archai.html](https://fineartmedia.tech/archai.html)

And the three current object-page examples are here again, because honestly the thing makes more sense when you click it:

[Lavoisier portrait](https://fineartmedia.tech/nfc-pages/v/NFC120.html)

[Dynatron TV23A Falcon](https://fineartmedia.tech/nfc-pages/v/NFC010.html)

[Charles II guinea](https://fineartmedia.tech/nfc-pages/v/NFC046.html)

One object. One page. One working pathway.

Then another.

*Rob Graham is a PhD candidate at RMIT University (Design), founder of FAMTEC (Fine Art Media Tech), and former Head of Technology at the National Communication Museum. His research focuses on sovereign AI infrastructure for cultural heritage institutions.*

*ARCHAI™ is a trademark of Rob Graham / FAMTEC.*
