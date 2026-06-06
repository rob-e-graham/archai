# ARCHAI Voice Flow Audit — 2026-06-05

## Purpose

Full technical audit of the current browser-native voice demo and a concrete plan for the Whisper (STT) + Coqui/Piper (TTS) backend upgrade.

This covers both the main ARCHAI app (`ARCHAI_v10_8.html`) and AUX.IO visitor pages (`nfc-visitor-template.html`).

---

## Part 1: Current State — Browser-Native Demo

### What is live today

Both the main app and AUX.IO have four voice controls:

| Button | Function |
|--------|----------|
| Start Voice Question | Activates browser microphone via Web Speech API |
| Stop Listening | Stops recognition early |
| Read Reply | Reads the last ARCHAI response aloud via browser TTS |
| Stop Audio | Cancels browser speech playback |

Both surfaces also now include a **Playback Voice** selector with:

- `ARCHAI Neutral (recommended)`
- `Browser Default`
- browser/system voice options exposed by the active device

### STT (Speech-to-Text) — Browser Side

**Main app** (`ARCHAI_v10_8.html`, lines 1417–1477):

- Uses `window.SpeechRecognition || window.webkitSpeechRecognition`
- `continuous: false` — captures one utterance then stops
- `interimResults: true` — shows partial transcription as user speaks
- On final result: injects transcript into `#od-chat-in` and calls `odChat()`
- Language code: reads from `window._odResponseLanguage` → maps to BCP-47 codes
- Supported: `en-AU`, `ar`, `es`, `fr-FR`, `pt-BR`, `ja-JP`
- Desktop microphone selection is still browser/system-default only

**AUX.IO** (`nfc-visitor-template.html`, lines 1051–1107):

- Same Web Speech API pattern
- `interimResults: false` — waits for final result only
- `maxAlternatives: 1`
- On final result: injects into `#chatInput` and calls `askObject(transcript)`
- Language code: reads from `document.documentElement.lang || navigator.language || 'en-AU'`
- This is currently the strongest live test path in practice, especially on phone

**Key difference**: Main app does interim display (typing appears as you speak); AUX.IO waits for the full utterance before filling the input. Both auto-submit when speech ends.

### TTS (Text-to-Speech) — Browser Side

**Main app** (`ARCHAI_v10_8.html`, lines 1486–1510):

- Uses `window.speechSynthesis` + `SpeechSynthesisUtterance`
- Reads `window._odLastAssistantReply`
- Language set from `getOdSpeechLanguageCode()`
- Exposes `ARCHAI Neutral`, `Browser Default`, and device voices through a selector
- `ARCHAI Neutral` prefers more modern voices and avoids obvious legacy voices where possible
- `utterance.rate = 1.0`
- `utterance.pitch = 1.0`

**AUX.IO** (`nfc-visitor-template.html`, lines 1116–1141):

- Same API pattern
- Reads `visitorLastReply`
- `utterance.rate = 0.98` — slightly slowed for clarity
- Language set from `getVisitorSpeechLanguageCode()`
- Exposes the same playback voice selector as the main app

### UI State Management

Both implementations track state via simple flags:

- Main app: `window._odSpeechRecognition`, `window._odSpeechListening`, `window._odSpeechStatus`
- AUX.IO: `visitorSpeechRecognition`, `visitorSpeechListening`, `visitorSpeechStatus`

Button enable/disable logic is handled in `updateOdSpeechUI()` / `updateVisitorSpeechUI()`.

### Cleanup

Main app cancels `speechSynthesis` on object detail close (line 2878):
```js
if (window.speechSynthesis) window.speechSynthesis.cancel();
```

AUX.IO has no explicit cleanup on page unload — the browser handles it.

---

## Part 2: Audit Findings

### What works well

1. **Flow is correct**: Mic → transcript → question input → ARCHAI response → read aloud. The core loop works.
2. **Language-aware**: Both surfaces respect the active language for STT and TTS.
3. **Auto-submit**: Speech results trigger the question flow automatically — no extra click needed.
4. **Graceful fallbacks**: Both check for API availability and show clear messages when speech isn't supported.
5. **Status messaging**: The UI shows clear state transitions (Listening → Captured → Sending → Reading).
6. **Quick to test**: Zero backend dependencies — anyone on the LAN can test voice flow from a phone right now.

### Issues and gaps

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Browser dependency** | High | Web Speech API is Chrome/Edge only on desktop. Firefox and Safari have partial or no support. Mobile Safari has limited recognition. This is not production-viable for kiosk or cross-browser institutional deployment. |
| 2 | **No audio recording preserved** | Medium | Speech is transcribed and discarded by the browser. No audio is stored, streamed, or logged. Good for privacy right now, but means no research corpus, no quality audit trail, no replay. |
| 3 | **Google cloud dependency (Chrome)** | High | Chrome's SpeechRecognition sends audio to Google's servers for processing. This directly contradicts ARCHAI's sovereign infrastructure principle. Users are not informed that speech leaves the device. |
| 4 | **TTS voice quality still varies by device** | Medium | The new playback-voice selector helps a lot, but browser TTS still depends on whatever voices the device exposes. Neutral selection is improved, not fully standardized. |
| 5 | **No streaming TTS** | Low | Browser TTS buffers the full text before speaking. Long replies have a noticeable delay. Streaming would feel more natural. |
| 6 | **AUX.IO has no interim display** | Low | AUX.IO waits for the full utterance. Users don't see their words appearing as they speak. The main app does show interim text. |
| 7 | **No reliable visual mic activity indicator** | Medium | There is status text, but not yet a robust cross-surface visual pulse/waveform confirming active capture. Important for accessibility and user confidence. |
| 8 | **Read Reply reads the whole response** | Low | No option to read just the first sentence, skip, or control pacing. Fine for now, but matters for longer curatorial responses. |
| 9 | **No in-app mic selector on desktop** | Medium | Desktop Chrome uses the browser/system default microphone. Users cannot currently choose between multiple input devices inside ARCHAI or AUX.IO. |
| 10 | **Language mapping incomplete** | Low | Main app supports 6 explicit response languages for speech codes. AUX.IO falls back to page lang or navigator. Neither covers all 11 collection source languages. |
| 11 | **No speech privacy notice** | Medium | No visible disclosure that speech may be processed off-device (Chrome's Google dependency). Ethics application will need this addressed. |

### Backend: No voice endpoints exist yet

The backend (`backend-archai`) currently has **zero voice-related routes**. The server routes are:

```
/api/health, /api/search, /api/objects, /api/nfc, /api/upload,
/api/vocab, /api/nodel, /api/admin, /api/famtec, /api/chat,
/api/pipeline, /api/integrations, /api/comments, /api/media,
/api/workflows, /api/webhooks, /api/proxy
```

No `/api/speech`, `/api/stt`, `/api/tts`, or `/api/voice` exists. The personality system (`personality.json`) has rich per-profile `voice` instructions for the LLM, but these are text-level personality — not audio voice.

---

## Part 3: Whisper + Coqui/Piper Backend Plan

### Architecture

```
Visitor phone / kiosk browser
  │
  ├── [mic] Record audio as WebM/WAV blob
  │         (MediaRecorder API — works everywhere, no Google dependency)
  │
  ├── POST /api/voice/stt
  │     Body: audio blob + language hint
  │     Server: Whisper / faster-whisper / whisper.cpp
  │     Returns: { transcript, language, confidence }
  │
  ├── [existing] POST /api/proxy/chat or /api/chat
  │     Body: transcript as user message
  │     Returns: ARCHAI response text
  │
  └── POST /api/voice/tts
        Body: { text, language, voice_profile? }
        Server: Coqui XTTS-v2 or Piper
        Returns: audio/wav or audio/mp3 stream
        Client: plays via <audio> element or AudioContext
```

### STT: Whisper Options

| Option | Best for | Notes |
|--------|----------|-------|
| **whisper.cpp** | Mac Studio (Apple Silicon) | C/C++ native, Metal GPU acceleration, runs locally, ~1GB for medium model. Best sovereignty story. |
| **faster-whisper** | Mac Studio or Docker | Python, CTranslate2 backend, 4x faster than original Whisper, lower memory. |
| **OpenAI Whisper (original)** | Reference/testing | Python, PyTorch, heavier, but most documented. |

**Recommendation**: `whisper.cpp` for production on the Mac Studio. It's the fastest local option on Apple Silicon, zero cloud dependency, multilingual out of the box.

Model sizes for whisper.cpp:

| Model | Size | Speed (M2 Ultra) | Quality |
|-------|------|-------------------|---------|
| tiny | 75 MB | ~10x realtime | Usable for English |
| base | 142 MB | ~7x realtime | Good for single-language |
| small | 466 MB | ~4x realtime | Good multilingual |
| medium | 1.5 GB | ~2x realtime | Strong multilingual |
| large-v3 | 3.1 GB | ~1x realtime | Best quality, all languages |

For museum/gallery context with 6+ languages: `medium` is the sweet spot. `large-v3` if the Mac Studio has headroom.

### TTS: Coqui vs Piper

| Option | Best for | Notes |
|--------|----------|-------|
| **Coqui XTTS-v2** | Rich multilingual, voice cloning possible | Heavier (~2GB model), Python, supports 17 languages, can clone a voice from a 6-second sample. Slower inference. |
| **Piper** | Lightweight, fast, clear narration | C++ native, small models (~50-100MB per voice), very fast on CPU, but fewer voice options and no cloning. |

**Recommendation**: Start with **Piper** for clean accessibility narration — it's fast, lightweight, sovereign, and produces clear speech. Add Coqui XTTS-v2 later if you want richer, more characterful object voices or multilingual voice profiles tied to collection personality.

### Ethics note on voice cloning

Coqui XTTS-v2 can clone voices from short samples. This is powerful but ethically sensitive in museum contexts:

- Do not clone voices of living people without explicit consent
- Do not simulate voices of historical figures without clear institutional framing
- Neutral accessibility narration is safer than theatrical mimicry
- Any voice cloning experiment needs ethics clearance via RMIT SDR

### Proposed backend routes

```
POST /api/voice/stt
  - accepts: multipart audio blob (webm, wav, mp3)
  - optional: language (BCP-47 code or 'auto')
  - returns: { transcript, detected_language, confidence, duration_ms }
  - backend: whisper.cpp via child process or HTTP wrapper

POST /api/voice/tts
  - accepts: { text, language, voice_profile? }
  - returns: audio/wav or audio/mp3 (streaming preferred)
  - backend: Piper (default) or Coqui XTTS-v2
  - voice_profile maps to personality system profiles (narrator, docent, poetic, etc.)

GET /api/voice/status
  - returns: { stt_available, tts_available, stt_engine, tts_engine, models_loaded }
  - health check for voice subsystem
```

### Frontend changes needed

**Replace browser SpeechRecognition with MediaRecorder**:

```js
// Instead of:
const recognition = new SpeechRecognition();
recognition.start();

// Use:
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
// ... collect chunks, POST blob to /api/voice/stt
```

**Replace browser speechSynthesis with audio playback**:

```js
// Instead of:
const utterance = new SpeechSynthesisUtterance(text);
speechSynthesis.speak(utterance);

// Use:
const response = await fetch('/api/voice/tts', {
  method: 'POST',
  body: JSON.stringify({ text, language })
});
const audio = new Audio(URL.createObjectURL(await response.blob()));
audio.play();
```

**Keep browser fallback**: If `/api/voice/status` reports unavailable, fall back to the current browser demo. This preserves the "works anywhere" testing path.

### Important implementation principle

Do **not** replace the currently working phone/browser path too early.

The safest rollout is:

1. keep browser speech as the live baseline
2. add recorded-audio + Whisper as an opt-in advanced path
3. add desktop microphone selection only inside that new recorder flow
4. merge it into the main experience only once it matches or exceeds the current phone usability

### Installation on Mac Studio

```bash
# whisper.cpp
git clone https://github.com/ggml-org/whisper.cpp
cd whisper.cpp
make -j
./models/download-ggml-model.sh medium

# Piper
pip install piper-tts
# or build from source for Apple Silicon optimization
```

### Privacy and data handling

| Concern | Current (browser) | Future (backend) |
|---------|-------------------|-------------------|
| Audio leaves device? | Yes (Chrome sends to Google) | No (local Whisper) |
| Audio stored? | No | Configurable: ephemeral by default, opt-in logging for research |
| Transcript stored? | Only as chat message | Same — part of interaction log |
| User informed? | No disclosure | Must add mic-active indicator + privacy notice |
| Ethics clearance | Not yet needed (prototype) | Required before public testing |

---

## Part 4: Implementation Priority

### Phase 1 — Backend STT (Whisper)

1. Install whisper.cpp on Mac Studio
2. Create `/api/voice/stt` route
3. Replace browser SpeechRecognition with MediaRecorder + backend POST
4. Add `/api/voice/status` health check
5. Test with all 6 supported languages

### Phase 2 — Backend TTS (Piper)

1. Install Piper with en-AU voice
2. Create `/api/voice/tts` route
3. Replace browser speechSynthesis with audio element playback
4. Map personality profiles to voice selection
5. Add multilingual voice packs as needed

### Phase 3 — Integration + Polish

1. Add mic-active visual indicator (pulse/waveform)
2. Add speech privacy notice to both surfaces
3. Add streaming TTS for long responses
4. Add browser fallback detection
5. Update AUX.IO generator to use backend voice routes
6. Update ethics documentation

### Phase 4 — Research + Coqui (optional)

1. Evaluate Coqui XTTS-v2 for richer object voices
2. Test voice profile mapping (narrator, docent, poetic, etc.)
3. Consider opt-in audio logging for research corpus
4. Ethics clearance for any stored speech data

---

## Part 5: What This Means for the PhD

The voice flow maps directly to several ARCHAI white paper contributions:

1. **Sovereign infrastructure**: Moving from Chrome→Google speech to local Whisper+Piper eliminates the last cloud dependency in the interaction layer.

2. **Accessibility as first-class**: Speech input/output makes collections accessible to visitors who cannot type or read screens. This is not an add-on — it's a core architectural position.

3. **Multilingual access**: Whisper's multilingual recognition + language-aware TTS means a visitor can speak Portuguese to a Brazilian collection object and hear a Portuguese response — without any cloud translation service.

4. **Object personality through voice**: The personality system already has voice instructions per profile (narrator, docent, casual, poetic). TTS voice selection can eventually match these, giving objects distinct vocal character.

5. **Ethical AI interaction**: Local speech processing means interaction data stays sovereign. The ethics application can describe a system where no visitor speech ever leaves the institution's hardware.

---

## Summary

| Layer | Current | Target |
|-------|---------|--------|
| STT engine | Browser Web Speech API (Chrome→Google) | whisper.cpp (local, sovereign) |
| TTS engine | Browser speechSynthesis (system voices) | Piper (local, consistent) → Coqui (optional, richer) |
| Audio recording | None (browser handles internally) | MediaRecorder → blob → backend |
| Audio storage | None | Ephemeral by default, opt-in research logging |
| Privacy | No disclosure, Google dependency | Local processing, privacy notice, ethics-ready |
| Languages | 6 (main app) / auto (AUX.IO) | All Whisper-supported (99 languages) |
| Voice profiles | None (system default) | Mapped to personality system |
| Fallback | N/A | Browser demo if backend unavailable |
