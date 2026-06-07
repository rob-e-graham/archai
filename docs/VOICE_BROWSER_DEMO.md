# ARCHAI Browser Voice Demo

## What this document covers

This note explains how microphone and speaker support work in the browser today for:

- the main ARCHAI app
- AUX.IO visitor pages

It also explains the difference between the current browser demo and the future Whisper + Coqui production path.

## Current state

The voice feature that is live right now is a **browser-native demo**.

It uses the browser's built-in speech APIs rather than a local Whisper or Coqui server.

In practice, the current **protected baseline** is the phone/browser flow, especially for AUX.IO. That is the path we know is exciting, useful, and already working in live testing. Any future desktop mic-selection or Whisper work should be added as a separate layer rather than replacing the current phone path too early.

Both the main app and AUX.IO now also expose a **Playback Voice** selector with:

- `ARCHAI Neutral (recommended)`
- `Browser Default`
- any browser/system voices made available by the current device

`ARCHAI Neutral` tries to prefer more modern browser voices and avoid older legacy voices where possible.

On some phones and tablets this means users may see a large browser-provided voice list, sometimes 20–30 voices or more, depending on the OS language packs and browser capabilities.

2026-06-07 interaction update:

- `Start Voice Question` now changes immediately to `Listening...` while capture is starting
- the status indicator turns on immediately rather than waiting for the browser `onstart` event
- AUX.IO now requests interim speech results where supported, so visitors can see words appear sooner
- unsupported-browser copy is session-based rather than device-blaming, because support varies by browser, permission state, and OS settings

That means:

- microphone input is handled by the browser
- speech playback is handled by the browser
- ARCHAI still does the semantic / interpretive response in the middle
- but the speech layer itself is not yet fully sovereign or backend-controlled

## How microphone input works

In both the main app and AUX.IO, the microphone uses:

- `window.SpeechRecognition`
- or `window.webkitSpeechRecognition`

When a user presses `Start Voice Question`:

1. the browser asks for microphone permission if needed
2. speech recognition starts in the browser
3. spoken text is transcribed locally/by-browser into a text string
4. that text is placed into the ARCHAI/AUX.IO question flow
5. the app sends the resulting text question into the usual ARCHAI conversation path

### Important limitation

This current browser demo does **not** provide an in-app microphone picker on desktop. The browser uses the system or browser-default microphone.

That means:

- phone testing is currently the simplest path
- desktop voice can still work
- but microphone selection on desktop must currently be changed in the browser or operating system, not inside ARCHAI

Main app implementation:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html)
  - `getOdSpeechLanguageCode()`
  - `ensureOdSpeechRecognition()`
  - `odStartVoiceQuestion()`
  - `odStopVoiceQuestion()`

AUX.IO implementation:

- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html)
  - `getVisitorSpeechLanguageCode()`
  - `ensureVisitorSpeechRecognition()`
  - `startVisitorVoiceQuestion()`
  - `stopVisitorVoiceQuestion()`

### Active language / tone behavior

The main app currently exposes these explicit response-language buttons in object detail:

- `English`
- `Arabic`
- `Spanish`
- `French`
- `Portuguese`
- `Japanese`

These drive:

- object chat reply language
- speech-recognition language hint
- speech playback language hint
- the optional `Translate Record` action in object detail

AUX.IO does not currently expose the same explicit language row. It uses:

- `document.documentElement.lang`
- or `navigator.language`
- with visitor tone modes layered over the top

Current AUX.IO tone modes are:

- `Guide`
- `Curatorial`
- `Learning`
- `Interpretive`

## How speaker output works

For read-aloud playback, the browser uses:

- `window.speechSynthesis`
- `SpeechSynthesisUtterance`

When a user presses `Read Reply`:

1. the latest ARCHAI reply text is retrieved
2. the browser creates a speech utterance
3. the utterance language is set from the current object / page context
4. the browser reads the reply aloud through the device speaker

The playback-voice selector now gives three layers of control:

1. `ARCHAI Neutral (recommended)`
2. `Browser Default`
3. any browser/system voices exposed by the current device

`ARCHAI Neutral` is a preference layer, not a custom model. It tries to choose a more modern, neutral browser voice and avoid older legacy voices where possible.

Main app implementation:

- [ARCHAI_v10_8.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/ARCHAI_v10_8.html)
  - `odSpeakLatestReply()`
  - `odStopSpeaking()`

AUX.IO implementation:

- [nfc-pages/nfc-visitor-template.html](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/nfc-pages/nfc-visitor-template.html)
  - `speakVisitorReply()`
  - `stopVisitorSpeech()`

## What this is good for

The browser demo is useful because it lets us test:

- whether voice interaction feels natural
- whether visitors understand the control pattern
- whether the speech layer supports accessibility
- whether response tone makes sense aloud
- whether the phone and kiosk flows feel right
- whether multilingual object chat feels usable aloud
- whether neutral browser voices feel acceptable before a true TTS stack is added

It is a fast, low-risk way to prototype voice behavior.

## What this is not

This is **not yet**:

- Whisper-based speech-to-text
- Coqui-based text-to-speech
- a guaranteed cross-browser production voice layer
- a fully local sovereign speech stack
- a final archival or accessibility implementation

Browser speech APIs vary between browsers and devices, and some kiosk environments may not support them reliably.

This is why the current project stance should be:

- keep the phone/browser path stable
- improve desktop separately
- only replace browser STT when a Whisper path is genuinely better

## Why Whisper + Coqui still matter

The browser demo is a bridge, not the end state.

### Whisper / faster-whisper / whisper.cpp

These are good candidates for future speech-to-text because they offer:

- better control
- multilingual transcription
- clearer deployment logic
- a local processing path
- more transparency than black-box browser speech

### Coqui TTS (or similar local TTS)

This is a good future direction for text-to-speech because it offers:

- more consistent voice behavior
- better control over tone and accessibility voice modes
- a more sovereign local speech path
- clearer integration into institutional deployments

## Important design principle

ARCHAI should keep a clear distinction between:

- accessibility narration
- curatorial interpretation
- public guide voice
- performative / fictional object voice

That matters even more once speech becomes more polished.

## Practical testing note

At the moment, if a page says:

- `Start Voice Question`
- `Stop Listening`
- `Read Reply`
- `Stop Audio`

that is the browser demo path.

It is currently the easiest way to test voice flow from:

- phone browsers on the same local network
- desktop browsers that already have a usable default microphone configured
- AUX.IO preview pages

For the current project phase, **phone testing is the most trustworthy baseline**.

## Next production step

Move from browser-native speech toward a backend speech layer:

1. Whisper / faster-whisper / whisper.cpp for speech-to-text
2. Coqui or another local TTS engine for speech output
3. clear handling of speech privacy, storage, and ethics
4. multilingual routing built into onboarding and interaction layers

## Full audit

See [VOICE_AUDIT_2026-06-05.md](/Users/robgraham/Desktop/APPS/ARCHAI%20APP/docs/VOICE_AUDIT_2026-06-05.md) for the complete technical audit of the browser demo, findings, and the Whisper + Coqui/Piper backend implementation plan.
