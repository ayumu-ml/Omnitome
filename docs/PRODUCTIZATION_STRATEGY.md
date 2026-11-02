# Omnitome Productization Strategy (v1.1.0 Stable & Beyond)

> **Release Version:** `v1.1.0 Stable`  
> **Repository:** `ayumu-ml/Omnitome` *(Historical / Working Directory: `Smart-Reader`)*  
> **Status:** Strategic Product Architecture & Distribution Roadmap  
> **Integrity Verification:** 61 Unit & Regression Suites | 17 Rust Supervisor Tests | 10/10 Corpus Gate

---

## Core Philosophy

Omnitome will never artificially cripple open-source software, paywall fundamental machine learning capabilities, or compromise data privacy. The open-source Community edition is 100% feature-complete, zero-egress, and unencumbered. 

Commercial and Store editions monetize **turnkey convenience, certified OS distribution channels, automated updates, enterprise SLA guarantees, and curated synthetic content packs** for non-technical readers and professional organizations who value time and compliance above manual compilation.

---

## 1. Distribution Editions & Dual-Licensing Tiers

### 1.1 Omnitome Community Edition (AGPL-3.0-only)
- **Target Audience:** Developers, researchers, privacy-conscious readers, self-hosters, and open-source contributors.
- **Engine Capabilities:** 100% full-featured. Zero restrictions on local BGE-M3 embedding, BGE Reranker v2 cross-encoding, Kokoro-82M neural TTS narration, or PaddleOCR ingestion.
- **Onboarding Experience:** 5-step Welcome Wizard, live theme auditioning, local Ollama / LM Studio pairing, and 1-click Synthetic Archive installation (6 volumes).
- **Distribution Channel:** GitHub Releases (`Omnitome_1.1.0_x64-setup.exe` standalone NSIS installer) and source builds.
- **Support & Monetization:** Community issue tracker, GitHub Sponsors, and voluntary project contributions.

### 1.2 Omnitome Store Edition (Commercial Windows / macOS)
- **Target Audience:** General book lovers, students, business executives, and professionals requiring a seamless "click-and-run" desktop experience without SmartScreen warnings or manual configuration.
- **Engine Capabilities:** Identical high-performance local-first engine as Community edition.
- **Store Advantages:**
  - Authenticode EV code-signed binary eliminating Windows SmartScreen warnings on first launch.
  - Native background silent auto-updates via Microsoft Store / Apple Mac App Store.
  - Pre-cached local neural model weights requiring zero first-launch download latency.
- **Distribution & Pricing:** One-time purchase ($19–$29 perpetual license) via Microsoft Store, Steam, or direct merchant platform (Lemon Squeezy / Stripe).

### 1.3 Enterprise & OEM Commercial Licensing
- **Target Audience:** Legal firms, medical research teams, defense contractors, and corporate intranet knowledge bases with strict compliance policies prohibiting AGPL-3.0 copyleft integration.
- **Licensing Pathway:** Dual-licensing model via the private upstream repository (`Omnitome-Private`), granting commercial proprietary rights, OEM bundling rights, private-cloud deployment rights, and priority engineering SLAs.

---

## 2. The Canonical Public Synthetic Archive

To eliminate the "cold start" friction of requiring readers to supply and wait for a multi-chapter book import on first launch, Omnitome v1.1.0 ships with a **curated 6-volume Synthetic Archive**. 

All 6 books were authored by Omnitome Publishing and the Omnitome Engineering Team, released under permissive Creative Commons Attribution (CC-BY 4.0) and Public Domain (CC0) terms.

### 2.1 The 6 Canonical Starter Volumes
1. ***The Curious World of Cats*** (Omnitome Publishing)
   - *Domain:* Accessible popular natural history and feline evolutionary biology.
   - *Technical Role:* Baseline OCR evaluation, complex footnote handling, and companion OCR test plates (`the_curious_world_of_cats_OCR_Test_Plates.pdf`).
2. ***The Art and Science of Reading*** (Omnitome Publishing)
   - *Domain:* Cognitive psychology, reading neuroscience, and literary philosophy.
   - *Technical Role:* Ingestion benchmark for dense academic arguments and semantic compression validation against unconstrained summarization.
3. ***The Asterion Expedition*** (Omnitome Publishing)
   - *Domain:* Hard science fiction narrative chronicle.
   - *Technical Role:* Long-form multi-character narrative stress test verifying that ~7:1 compression maintains character consistency and plot causality.
4. ***Machine Learning Field Notes*** (Omnitome Publishing)
   - *Domain:* Practitioner's handbook on neural transformers, vector spaces, and loss functions.
   - *Technical Role:* High-density mathematical formula extraction (LaTeX/KaTeX), code block preservation, and tabular layout parsing.
5. ***The Making of Omnitome*** (The Omnitome Engineering Team)
   - *Domain:* Software engineering memoir and system architecture chronicle.
   - *Technical Role:* Documents the multi-process desktop topology (Rust + Node + Python), the F65 await barrier, and the provenance thesis.
6. ***The Omnitome Field Guide*** (Omnitome Publishing)
   - *Domain:* Operational manual and user reference handbook.
   - *Technical Role:* Practical guide for readers mastering keyboard shortcuts, audio playback decks, and sentence-level citation tracing.

### 2.2 Ground Truth Regression Assets & 4-Layer Attribution
- **Ground Truth Validation:** Every synthetic volume is accompanied by verbatim markdown ground truth (`frontend/public/samples/ground_truth/`) enabling programmatic CI regression assertions against parser drift and OCR accuracy.
- **4-Layer Attribution Defense:** Pre-formatted volumes are protected by an automated four-layer metadata defense pipeline (PDF Info dictionary extraction, bibliographer regex with middle initial/suffix support, database self-healing backfills, and client fallback reconciliation) ensuring that author credit ("Omnitome Publishing") is never lost during ingestion.

---

## 3. The "Experience Before Generation" Onboarding Flow

The greatest friction in document intelligence apps is demanding that first-time users configure API keys and wait 5 minutes for a book to import before seeing the user interface.

Omnitome solves this via the **5-Step Welcome Wizard** (`frontend/src/components/onboarding/`):
1. **Step 1: The North Star Manifesto:** Introduces the three foundational laws (*"Source is paper. The lens is tinted. Derivation never masquerades as source"*).
2. **Step 2: Thematic Audio-Visual Styling:** Readers select their preferred reading aesthetic (Omni, Sakura, Spring, Coffee, Cyberpunk) with instantaneous auditory preview through the 90-stem sound engine.
3. **Step 3: AI Engine Pairing:** Transparent configuration supporting local zero-egress engines (Ollama / LM Studio) or user-supplied cloud keys (OpenRouter / Gemini), with a frictionless "Skip for Now" option.
4. **Step 4: Synthetic Archive Starter Pack:** One-click pre-selection of the 6 canonical volumes, imported in parallel with live status reporting.
5. **Step 5: Library Transition:** Smooth transition into the populated library, allowing readers to immediately click an Omni Chapter, inspect clickable sentence-level citations, audition Kokoro neural TTS, and verify provenance against immutable source text.

---

## 4. Implementation Phasing & Milestones

| Milestone | Scope & Deliverables | Status |
| :--- | :--- | :---: |
| **Phase 1 (v1.0.x)** | Standalone Tauri v2 desktop shell, 2GB NSIS ceiling overcome via LZMA `sidecar.7z`, PyInstaller PyTorch FP16 CUDA/cuDNN bundling, offline Kokoro-82M TTS, SQLite WAL single-writer architecture, and 60 backend unit test suites. | **COMPLETED & SHIPPED** |
| **Phase 2 (v1.1.0)** | 5-Step Welcome Wizard, 90-stem procedural Web Audio engine with narration ducking, 6-volume Synthetic Archive Starter Pack with ground truth evaluation suites, 4-layer author attribution defense, GitHub Sponsors integration, and Oct 24 playtest bug bash resolution. | **COMPLETED & SHIPPED** |
| **Phase 3 (v1.2+)** | **F55 Domain-Aware Structure Engine:** Content-adaptive TOC extraction for legal briefs, scientific papers, and dense technical specifications. Windows Authenticode EV Code Signing for seamless installation. Cross-platform sidecar packaging (macOS Universal and Linux AppImage). | **CURRENT ROADMAP** |
| **Phase 4 (v2.0)** | Microsoft Store & Steam publishing. Enterprise dual-licensing distribution. Native multi-speaker voice cloning and conversational discussion mode over research dossiers. | **PLANNED** |

---

*Authored by the Omnitome Product & Architecture Group.*  
*Maintained in concordance with `AGENTS.md` and `docs/RIGHTS.md`.*
