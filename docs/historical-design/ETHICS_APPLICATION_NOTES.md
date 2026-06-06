# Ethics Application Notes — RMIT SDR

**Author**: Rob Graham
**Context**: RMIT Design PhD — supervised by Chris Barker
**Last updated**: 2026-06-05
**Status**: Working preparation document for RMIT Research Ethics Platform submission

---

## 1. Context

RMIT SDR (Staff and Doctoral Researcher) ethics application is a required step before ARCHAI can move into public testing, institutional collaboration, or any research involving human participants.

ARCHAI is moving beyond a pure technical prototype and toward:

- institutional collaboration (Museums Victoria, potentially others)
- public testing (visitors interacting with objects via voice and text)
- staff-facing workflows (curators, collections managers, researchers)
- speech and accessibility experiments (microphone input, speech output)
- AI-assisted interpretation (LLM-generated responses about cultural heritage objects)
- data collection (interaction logs, speech transcripts, visitor questions)

That means ethics planning needs to sit alongside design and engineering, not after them.

---

## 2. RMIT Human Research Ethics Process

### 2.1 Platform

All human research ethics applications are submitted via the **RMIT Research Ethics Platform (REP)**. This is the online system — previously referred to as SDR in some contexts.

Access: via the **Researcher Portal** (RMIT internal system)
Contact: humanethics@rmit.edu.au

### 2.2 Risk Classification

RMIT uses three risk levels, aligned with the Australian National Statement on Ethical Conduct in Human Research:

| Risk level | Definition | Review body |
|------------|-----------|-------------|
| **Negligible risk** | No foreseeable risk of harm or discomfort to participants beyond inconvenience | CHEAN |
| **Low risk** | The only foreseeable risk is one of discomfort (not harm) | CHEAN |
| **More than low risk** | Potential for harm, sensitive populations, deception, covert research, vulnerable groups, or other significant ethical concerns | HREC |

- **CHEAN** (College Human Ethics Advisory Network): Reviews negligible and low-risk applications. Provides preliminary assessment and guidance.
- **HREC** (Human Research Ethics Committee): Conducts formal ethical review for higher-risk applications. Makes approval decisions. Evaluates proposals against the National Statement and institutional policies.

### 2.3 Process Timeline

1. **Risk assessment**: Completed before applying. Determines whether CHEAN or HREC review is needed.
2. **Governance review**: Starts within three business days of application submission. Checks completeness and compliance.
3. **Ethical review**: Does not begin until governance review is complete.
4. **Approval**: Formal notification of ethics approval must be received before any data collection or recruitment begins.

**Critical rule**: "Researchers will not collect data, commence recruitment activities, or effect amendments without first receiving formal notification of ethics approval."

### 2.4 Required Documentation

Based on RMIT's Human Research Ethics Procedure (Section 1):

- Detailed research protocol describing methodology
- Participant information and consent forms (PICF)
- Risk assessment documentation
- Evidence of compliance with relevant codes and policies
- Details about researcher qualifications and supervision
- Data management plan (how data is stored, secured, retained, destroyed)
- Any relevant institutional agreements (e.g., with partner museums)

### 2.5 Pre-application Requirements

- Complete mandatory ethics training (available through RMIT's Researcher Portal)
- Obtain institutional affiliation confirmation
- Secure supervisor approval (Chris Barker)
- Prepare comprehensive ethical assessment

### 2.6 Post-approval Obligations

- Maintain compliance with approved protocol
- Report any protocol modifications (amendments require approval before implementation)
- Document adverse events or unexpected outcomes
- Conduct research only as approved
- Submit annual progress reports if research extends beyond 12 months

Sources:
- [RMIT Human Research Ethics](https://www.rmit.edu.au/research/our-research/ethics-and-integrity/human-ethics)
- [RMIT Human Research Ethics Procedure](https://policies.rmit.edu.au/document/view.php?id=29)
- [RMIT Research Integrity — Your Responsibilities](https://www.rmit.edu.au/students/my-course/research-students/researcher-responsibilities)

---

## 3. ARCHAI's Likely Risk Level

### 3.1 Assessment

ARCHAI's research likely requires **HREC review** (more than low risk), not just CHEAN, because:

1. **AI-generated interpretation**: The system generates responses about cultural heritage objects using a large language model. There is a non-zero risk of the system producing inaccurate, misleading, or culturally inappropriate content, despite hallucination prevention safeguards.

2. **Speech/audio capture**: The planned Whisper backend will process visitor speech. Even if audio is not stored (ephemeral processing), the act of recording and processing speech raises privacy considerations.

3. **Institutional collaboration**: Working with partner museums (Museums Victoria, potentially others) introduces multi-party governance concerns.

4. **Culturally sensitive materials**: Some collection objects come from Indigenous communities, formerly colonised regions, or sensitive cultural contexts. AI interpretation of these objects requires particular care.

5. **Public audience**: Visitors in public museum spaces include children, non-English speakers, people with disabilities, and other groups that may require specific ethical consideration.

6. **Novel interaction paradigm**: Giving museum objects a conversational "voice" via AI is a genuinely novel interaction pattern. Its effects on visitor understanding, trust, and emotional response are not yet well understood.

### 3.2 Potential counter-argument for lower risk

If the initial study is limited to:
- Staff only (no public visitors)
- Consenting adult participants (museum professionals, researchers)
- No culturally sensitive objects in the test set
- No stored speech data
- Anonymised interaction logs only

...then a CHEAN (low risk) classification might be possible for an initial phase, with HREC review for subsequent public-facing phases.

**Recommended approach**: Discuss classification with RMIT's Human Research Ethics team before submitting. They can advise on whether a phased approach is appropriate.

---

## 4. Areas Requiring Ethical Consideration

### 4.1 User Interaction Data

**What ARCHAI currently collects or could collect:**

| Data type | Current status | Research potential | Privacy concern |
|-----------|---------------|-------------------|-----------------|
| Search queries | Logged in server console | Visitor interest patterns | Low (text only, no PII) |
| Object chat questions | Logged as conversation history | Visitor engagement, question types | Low-medium (could contain PII in questions) |
| Object chat responses | Generated and displayed | Response quality evaluation | Low (AI-generated) |
| Visitor comments | Comment system exists in backend | Visitor feedback analysis | Medium (user-generated content) |
| Speech audio (current) | Not stored (browser handles internally) | None | Low |
| Speech audio (future Whisper) | Configurable: ephemeral by default | Speech interaction research, multilingual analysis | Medium-high (biometric data) |
| Speech transcripts | Only as chat message text | Visitor question language, phrasing | Low-medium |
| Language preferences | Tracked per session | Multilingual visitor patterns | Low |
| Tone preferences | Tracked per session | Visitor engagement preferences | Low |
| Page views / navigation | Standard web analytics possible | Visitor journey mapping | Low |

**Key questions for the ethics application:**

- What is stored vs ephemeral?
- What is anonymised vs identifiable?
- What is retained for research vs discarded after session?
- What consent is required for each data type?
- How long is research data retained?
- Who has access to research data?
- How is data securely stored and eventually destroyed?

### 4.2 Speech Input and Output

If ARCHAI / AUX.IO use speech (which they already do via browser demo, and will via backend Whisper/Piper):

**Ethical requirements:**

1. **Microphone disclosure**: Users must know when the microphone is active. The current browser demo shows a text status ("Listening...") but has no prominent visual indicator (pulse, waveform). This needs improvement.

2. **Processing disclosure**: Users must know whether speech is:
   - Processed locally (future Whisper path — speech never leaves the device/institution network)
   - Sent to a cloud service (current Chrome browser path — audio goes to Google)
   - Stored for any purpose
   - Used for any purpose beyond the immediate interaction

3. **Consent**: For any stored speech data, explicit informed consent is required. For ephemeral processing (transcribe and discard), a clear notice may be sufficient — but this should be confirmed with the ethics committee.

4. **Accessibility framing**: Speech features should be described as accessibility tools that benefit visitors who cannot type or read screens, not just as novel technology. This framing strengthens the ethical case.

5. **Limitations disclosure**: Users should be informed that speech recognition may not work perfectly, especially for non-English languages, accented speech, or noisy environments. Setting realistic expectations is an ethical obligation.

### 4.3 AI-Assisted Interpretation

**Key ethical concerns:**

1. **Hallucinated claims**: The LLM could generate factually incorrect statements about objects. ARCHAI's hallucination prevention system constrains responses to the object's documented record and explicitly instructs the model: "If a fact is not written in your record below, you DO NOT know it, even if it seems like common knowledge." The ethics application should describe this safeguard and acknowledge its limitations.

2. **Interpretive authority**: When the system says "I am a 16th-century navigational chart," who is making that claim? The institution? The AI? The researcher? The ethics application should clearly frame AI-generated interpretation as a derived layer, not as institutional authority.

3. **Distinguishing record from generation**: Visitors need to understand the difference between:
   - Institutional metadata (title, date, medium — facts from the museum record)
   - AI-generated interpretation (conversational responses shaped by the personality system)
   
   The ethics application should describe how ARCHAI makes this distinction visible.

4. **Avoiding false authority**: The system should not claim expertise it does not have. The personality system's instruction "If you don't know something: 'That's not in my record — but ask me about [something you do know]'" is an ethical safeguard as much as a design decision.

5. **Culturally sensitive interpretation**: AI interpretation of objects from Indigenous, religious, or politically sensitive contexts requires particular care. The ethics application should describe:
   - How sensitive objects are identified
   - How interpretation is constrained for sensitive materials
   - Whether community consultation has occurred or is planned
   - How per-object cultural protocol gates work

### 4.4 Cultural Protocol and Restricted Knowledge

**Key questions:**

- How are community restrictions handled? (ARCHAI's per-object legal gating can restrict public visibility)
- How are culturally sensitive records treated? (Personality system can be constrained; objects can be excluded from AUX.IO)
- What is excluded from public interpretation? (Legal status gate currently prevents restricted objects from appearing on public pages)
- How are Indigenous data sovereignty principles respected? (Sovereign architecture keeps data under institutional control; but community consultation processes need to be described)

**Frameworks to reference:**

- CARE Principles for Indigenous Data Governance (Collective Benefit, Authority to Control, Responsibility, Ethics)
- Traditional Knowledge Labels (Local Contexts)
- AIATSIS Guidelines for Ethical Research in Australian Indigenous Studies
- NAGPRA (US context — relevant for collections from US institutions like the Met)

### 4.5 Partner Institutions

If testing with GLAM partners:

- What approvals are needed from each institution?
- What is considered public metadata vs internal metadata?
- What rights and sensitivities travel with the data?
- What responsibilities does ARCHAI carry as an interpretive layer?
- Who is liable if the AI says something incorrect about an object?
- Does the institution need to review and approve personality profiles for their objects?

**Recommended approach**: Develop a one-page "institutional data agreement" template that clarifies:
- What data ARCHAI harvests from the institution's API
- That ARCHAI stores metadata locally (no cloud)
- That ARCHAI generates interpretive responses from institutional records
- That the institution retains authority over their records
- How the institution can request object removal or restriction

---

## 5. Suggested Ethics Application Structure

### 5.1 Research title (draft)

"ARCHAI: Sovereign AI-Mediated Conversational Access to Cultural Heritage Collections — Design, Deployment, and Visitor Interaction Study"

### 5.2 Research questions (draft)

1. How do visitors engage with AI-driven conversational interfaces to museum objects?
2. What effect do different personality modes (narrator, docent, casual, poetic) have on visitor understanding and emotional response?
3. How do visitors perceive the trustworthiness of AI-generated interpretation grounded in institutional records?
4. What are the accessibility benefits of voice-based interaction with heritage collections for visitors who cannot type or read screens?
5. How does sovereign, locally-hosted AI infrastructure affect institutional confidence in deploying AI interpretation systems?

### 5.3 Methodology (draft)

- Practice-based design research (Research-through-Design)
- Mixed methods: system development + user evaluation
- Qualitative: semi-structured interviews with visitors and museum staff
- Quantitative: interaction logs (anonymised), task completion, questionnaires
- Iterative prototyping and deployment

### 5.4 Participant groups (draft)

| Group | Description | Risk level | Consent approach |
|-------|-------------|-----------|------------------|
| Museum staff / professionals | Curators, collections managers, IT staff at partner institutions | Low | Written informed consent |
| Adult visitors (public) | General museum visitors aged 18+ | Low-medium | Information sheet + opt-in interaction |
| Accessibility testers | Visitors with visual or motor impairments who test voice features | Medium | Written informed consent with accessibility accommodations |
| Researchers / PhD peers | Academic colleagues evaluating the system | Negligible | Written informed consent |

### 5.5 Data management plan (draft)

| Data type | Storage | Retention | Access | Destruction |
|-----------|---------|-----------|--------|-------------|
| Interaction logs (anonymised) | Encrypted local storage on Mac Studio | Duration of PhD + 5 years (RMIT requirement) | Researcher + supervisor only | Secure deletion |
| Interview recordings | Encrypted external drive | Duration of PhD + 5 years | Researcher + supervisor only | Secure deletion |
| Interview transcripts | Anonymised, encrypted local storage | Duration of PhD + 5 years | Researcher + supervisor only | Secure deletion |
| Speech audio (if stored for research) | Encrypted local storage, never on cloud | Specific study period only | Researcher + supervisor only | Secure deletion after analysis |
| System logs (server) | Local Mac Studio | Rolling 30-day retention | Researcher only | Automatic rotation |

---

## 6. Specific Ethical Safeguards ARCHAI Already Has

The ethics application can reference these existing safeguards:

1. **Hallucination prevention**: LLM constrained to object's documented record. Explicit instruction: "ONLY state facts from your record below. If it's not in the record, don't say it."

2. **Sentence limits**: Each personality profile enforces maximum sentence counts to prevent verbose, authority-claiming responses.

3. **Per-object legal gating**: Objects with restricted rights are excluded from public-facing interfaces. Legal status is normalised and visible.

4. **No character impersonation**: Unlike the Tesla chatbot approach, ARCHAI objects speak from their material reality, not as historical persons. This avoids the accuracy problems of biographical simulation.

5. **Moderation system**: The backend includes content moderation (moderation.js) that flags harmful content in visitor inputs.

6. **Sovereign architecture**: All data processing is local. No visitor data leaves the institution's network (once the Whisper upgrade eliminates the current Chrome-to-Google speech dependency).

7. **Source transparency**: The source institution, accession number, and rights status are visible alongside every object interaction.

---

## 7. Immediate Preparation Tasks

1. **Define what interaction data exists today**: Document every data type the system currently captures or could capture.

2. **Separate research logging from operational app behaviour**: Ensure that research data collection is a deliberate, consent-driven activity, not a default operational side-effect.

3. **Define how speech demo data is handled now**: Document that the current browser demo sends audio to Google (Chrome SpeechRecognition) and does not store it locally.

4. **Define how Whisper/Piper would change that**: Document the future local processing path and its privacy advantages.

5. **Note any public comment/feedback collection**: The backend has a comments system. Clarify whether comments are research data or operational data.

6. **Map partner-facing risks and mitigations**: Prepare the institutional data agreement template.

7. **Draft Participant Information and Consent Form (PICF)**: Standard RMIT template, customised for ARCHAI's specific interaction pattern.

8. **Complete RMIT ethics training**: If not already done.

9. **Discuss risk classification with humanethics@rmit.edu.au**: Before submitting, to confirm CHEAN vs HREC pathway.

---

## 8. Likely Supporting Documents for the Application

- Participant Information and Consent Form (PICF)
- Data management plan
- Privacy / data handling note
- Public demo disclaimer (visible to visitors)
- Speech interaction notice (visible when microphone is active)
- Rights and legal status explanation
- Cultural safety / restricted knowledge policy
- Institutional data agreement template (for partner museums)
- Hallucination prevention technical note
- System architecture summary (showing sovereign/local deployment)
