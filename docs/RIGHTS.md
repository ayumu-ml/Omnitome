# Omnitome Rights, Licensing & Intellectual Property Governance Charter

> **Release Version:** `v1.1.0 Stable`  
> **Repository:** `ayumu-ml/Omnitome` *(Historical / Working Directory: `Smart-Reader`)*  
> **Status:** Authoritative Repository Governance & Legal Compliance Charter  
> **Notice:** This charter establishes the binding open-source licensing terms, commercial dual-licensing pathways, third-party neural model attributions, data privacy guarantees, and distribution policies for the Omnitome desktop application, source repository, bundled runtimes, and documentation. It does not constitute formal legal counsel.

---

## 1. Core Repository Licensing Framework

### 1.1 GNU Affero General Public License v3.0 (AGPL-3.0-only)
Omnitome is free, open-source software built on the principles of user software freedom, algorithmic transparency, and immutable data sovereignty. All original application code, orchestration logic, build scripts, desktop supervisors, and engineering specifications within this repository are licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0-only)** as codified in the root [`LICENSE`](file:///c:/My%20Personal%20Folders/Projects%20to%20work%20on/Antigravity%20Projects/Smart-Reader/LICENSE).

Under AGPL-3.0-only, users and developers are guaranteed:
- **Full Source Access & Auditability:** The right to inspect, audit, compile, and run the complete source code without artificial barriers or locked runtimes.
- **Modification & Redistribution:** The freedom to adapt, enhance, and distribute modified versions of Omnitome, provided that any redistributed or network-interacting work carries the same AGPL-3.0 copyleft protections.
- **Copyleft Reciprocity:** Network operators and hosted platforms that interact with users over a computer network using a modified version of Omnitome are legally obligated to make the complete corresponding source code available to all network users at no charge.

### 1.2 Historical Licensing Evolution
- **Pre-v1.0 (Prior to October 18, 2026):** Early exploratory prototypes and milestones tagged prior to October 18, 2026 were published under permissive MIT terms.
- **v1.0 & Subsequent Stable Releases (October 18, 2026 onward):** Commencing with Milestone F95 and the formal v1.0 desktop release, the public Omnitome repository permanently transitioned to **AGPL-3.0-only**.

### 1.3 Dual-Licensing Commercial & Enterprise Pathways
For enterprise organizations, academic institutions, hardware manufacturers, and commercial integrators whose internal deployment requirements, closed proprietary stacks, or hardware distribution models cannot accommodate AGPL-3.0 copyleft obligations:
- **Commercial Dual-Licensing:** The project maintainers maintain an unencumbered upstream repository (`Omnitome-Private`) holding proprietary copyright ownership.
- **Commercial & OEM Grants:** Commercial agreements, OEM bundle licenses, private cloud redistribution grants, and dedicated enterprise support contracts are available directly from the project maintainers under separate commercial licensing terms.

### 1.4 Contributor Licensing & Inbound IP Governance
To preserve the legal viability of both the open-source AGPL-3.0 commons and the commercial dual-licensing pathway:
- **Developer Certificate of Origin (DCO):** All external contributions submitted to the public repository require agreement to the Developer Certificate of Origin (DCO 1.1), certifying that the contributor has the legal right to submit the code under AGPL-3.0.
- **Commercial Relicensing Grant:** By submitting code, pull requests, or patches to the Omnitome public repository, contributors grant the project maintainers a non-exclusive, perpetual, irrevocable, worldwide, royalty-free license to include, adapt, relicense, and distribute said contributions under commercial, non-copyleft terms within `Omnitome-Private` and derived commercial distributions.

---

## 2. Multi-Runtime Neural Model Attribution & Runtime Boundaries

Omnitome's local-first architecture executes vector embeddings, neural reranking, optical character recognition, and neural speech synthesis directly on the user's hardware via a dedicated Python sidecar (`127.0.0.1:8765`). All integrated machine learning weights, tokenizers, and phonetic runtimes are governed by verified open-source licenses:

| Component / Model | Organization / Creator | Upstream License | Architectural Role & Runtime Boundary |
| :--- | :--- | :--- | :--- |
| **BGE-M3** | BAAI (Beijing Academy of Artificial Intelligence) | **MIT License** | 1024-dimensional dense multilingual vector embeddings. Cached locally in INT8/FP16 format. Runs 100% on-device via PyTorch CUDA / CPU. |
| **BGE Reranker v2** | BAAI (Beijing Academy of Artificial Intelligence) | **MIT License** | FP16 cross-encoder passage re-ranking. Powers hybrid retrieval and deterministic provenance scoring. |
| **Kokoro-82M** | hexgrad | **Apache 2.0** | 82-million parameter neural text-to-speech engine (`v0.19`). Local voice vectors (`af_heart`, `am_adam`, `bf_emma`, etc.) synthesize offline audio. |
| **Misaki G2P** | hexgrad | **MIT License** | High-speed Grapheme-to-Phoneme phonemizer for English and Japanese text normalization prior to neural synthesis. |
| **espeak-ng / espeakng_loader** | Jonathan Duddington & contributors | **GPL-3.0-or-later / LGPL** | Phonetic pronunciation database bundled in frozen PyInstaller runtime (`resources/sidecar.7z`) for phonetic dictionary lookups. |
| **spaCy & `en_core_web_sm`** | Explosion AI | **MIT License** | Syntactic tokenization, part-of-speech analysis, and sentence boundary segmentation for structural chunking. Pre-bundled offline. |
| **PaddleOCR** | Baidu Inc. | **Apache 2.0** | Ultra-lightweight optical character recognition for scanned, damaged, or image-heavy document layers. |
| **PyMuPDF (`fitz`)** | Artifex Software, Inc. | **AGPL-3.0** | Layout-aware PDF structure extraction and table parsing. Distributed strictly in accordance with AGPL-3.0 terms. |
| **Hugging Face Transformers** | Hugging Face Inc. | **Apache 2.0** | Neural model loading, tensor scheduling, and Hugging Face tokenizer interfaces. |
| **PyTorch Runtime** | Meta AI & PyTorch Contributors | **BSD-3-Clause** | Core deep learning and tensor execution runtime supporting FP16 CUDA acceleration. |
| **NVIDIA CUDA & cuDNN** | NVIDIA Corporation | **NVIDIA Software License Agreement** | Dynamic runtime redistributable DLLs (`cudnn*.dll`, `cublas*.dll`, `nvrtc*.dll`) bundled in the PyInstaller sidecar payload (`resources/sidecar.7z`) strictly in compliance with NVIDIA redistribution permissions. |
| **better-sqlite3 & SQLite** | Joshua Wise / SQLite Consortium | **MIT / Public Domain** | High-performance local storage engine operating in WAL mode (`storage/data.db`) as the sole application state repository. |
| **Tauri v2 Shell (Rust)** | Tauri Programme / Commons Conservancy | **MIT / Apache 2.0** | Native Windows desktop container, process tree supervisor (`taskkill /F /T`), and dynamic port coordinator. |

---

## 3. User Content Ownership & Data Sovereignty Guarantee

Omnitome is founded upon three inviolable architectural laws:
1. **Law 1: Source is paper.** The original text is immutable ground truth.
2. **Law 2: The lens is tinted.** Derived representations are explicitly calibrated.
3. **Law 3: Derivation never masquerades as source.** Every claim carries deterministic provenance.

### 3.1 100% User Intellectual Property Ownership
- **Exclusive User Rights:** Users retain complete, unencumbered intellectual property rights and copyright to all content imported into Omnitome—including original source files (PDF, EPUB, DOCX, RTF, Markdown, HTML, TXT), extracted structural blocks, generated vector embeddings, notes, reading progress, and synthesized Omni chapters.
- **Zero Claim on User Derivations:** Omnitome, its developers, and contributors assert zero ownership, copyright, or licensing claim over documents uploaded or readings generated within the user's library.

### 3.2 Zero-Egress Local Execution by Default
- **Local Neural Processing:** Text parsing, layout extraction, structural chunking, SQLite WAL persistence, BGE-M3 vectorization, BGE cross-encoder re-ranking, and Kokoro-82M neural audio synthesis execute **100% locally on the user's device**.
- **No Remote Telemetry:** Omnitome contains zero usage tracking, Google Analytics, telemetry beacons, crash reporters, or device fingerprinting. The software makes zero network requests during normal local operation.
- **No Model Training on User Data:** User documents, embeddings, and reading histories are never pooled, transferred, or used to train, fine-tune, or calibrate any neural network or AI model.

### 3.3 Transparent User-Configured AI Inference Boundaries
Omnitome provides complete transparency regarding generative language model inference:
- **Air-Gapped Offline Compression (Recommended):** Users can pair Omnitome with a local LLM runner (e.g. Ollama or LM Studio at `127.0.0.1:11434` / `127.0.0.1:1234`), providing complete air-gapped zero-egress compression.
- **Optional User-Configured Cloud Providers:** If and only if the user explicitly supplies a personal API key for a cloud AI provider (such as OpenRouter or Google Gemini), Omnitome transmits the minimal necessary text context (~1,500–2,500 words per chapter) directly to that specific endpoint for semantic compression. The user's API credentials remain stored locally on disk and are never relayed to any intermediary server.

---

## 4. Third-Party & Bundled Assets Governance

### 4.1 The Canonical Public Synthetic Archive
Omnitome v1.1.0 bundles six foundational, original publications created by Omnitome Publishing and the Omnitome Engineering Team to serve as an instant reading showcase and regression verification corpus:

1. ***The Curious World of Cats*** — *Author:* Omnitome Publishing. *Subject:* Natural history, feline biology, and companion multi-modal OCR test plates.
2. ***The Art and Science of Reading*** — *Author:* Omnitome Publishing. *Subject:* Cognitive neuroscience of deep literacy and theoretical foundations of loss-bounded semantic compression.
3. ***The Asterion Expedition*** — *Author:* Omnitome Publishing. *Subject:* Hard science fiction narrative chronicle demonstrating ~7:1 compression without loss of narrative continuity.
4. ***Machine Learning Field Notes*** — *Author:* Omnitome Publishing. *Subject:* Practical deep learning engineering, mathematical formulas, and code block attribution.
5. ***The Making of Omnitome*** — *Author:* The Omnitome Engineering Team. *Subject:* Architectural memoir, multi-process desktop systems design, and the provenance thesis.
6. ***The Omnitome Field Guide*** — *Author:* Omnitome Publishing. *Subject:* Operational manual, navigation shortcuts, and citation inspection handbook.

**Licensing Terms for the Synthetic Archive:**
All six synthetic volumes are published and distributed under the **Creative Commons Attribution 4.0 International License (CC-BY 4.0)** and/or dedicated to the **Public Domain (CC0 1.0)**. Users and developers are free to read, share, adapt, and build upon these texts with attribution to Omnitome Publishing.

### 4.2 Procedural UI Sound Engine Assets
- The 90 thematic UI sound stems (18 canonical stems $\times$ 5 themes: Omni, Sakura, Spring, Coffee, Cyberpunk) are procedurally synthesized using deterministic mathematical DSP algorithms authored by the project (`tools/sound-design/generate.mjs`).
- They are licensed under the primary repository license (**AGPL-3.0-only**).

### 4.3 Test Corpus Fixtures & Calibration Isolation

Omnitome enforces a strict three-tier classification for test fixtures to guarantee absolute compliance with international copyright and distribution standards:

1. **Tier 1: Committed Open-Source & Public Domain Test Assets (`backend/tests/fixtures/`):**
   - **Cross-Format Corpus (`backend/tests/fixtures/corpus/`):** 10 multi-format fixtures used by the automated Corpus Release Gate (`scripts/run-corpus-tests.js`). All long-form works are verified Public Domain literature sourced from Project Gutenberg (Melville's *Moby Dick*, Austen's *Pride and Prejudice*, Whitman's *Leaves of Grass*, Hugo's *Les Misérables*, Paine's *Common Sense*) and Aozora Bunko (Tanizaki's *Chijin no Ai*), alongside project-authored test slices (`chat_11-slice.md`, `prologue-sample.md`, `sample.docx`, `sample.rtf`) licensed under AGPL-3.0-only.
   - **Standalone Calibration Samples:**
     - `ocr_calibration_sample.pdf`: National Bureau of Standards (NBS SP 500-20, 1980), Public Domain (U.S. Government work under 17 U.S.C. § 105).
     - `stress/math-heavy.pdf`: NIST FIPS 197-upd1 (AES Specification), Public Domain (U.S. Government).
     - `stress/table-heavy.pdf`: Apple Inc. FY23 10-K SEC Filing, Public Domain (Regulatory disclosure filing).
     - `encoding/` & `chat_log_sample.txt`: Project-authored encoding and chat turn verification fixtures (AGPL-3.0-only).

2. **Tier 2: Uncommitted Developer Calibration Fixtures (Gitignored):**
   - `backend/tests/fixtures/practical_machine_learning.pdf` (CRC Press, CC-BY-NC-ND 4.0 Open Access) serves as the developer ground truth benchmark (`docs/CANONICAL_TEST_BOOK.md`).
   - It is strictly gitignored (`backend/tests/fixtures/*.pdf` in `.gitignore`) and resides only on local developer environments. It is **never** redistributed via git or public mirrors.
   - Historical test fixtures carrying non-commercial or share-alike licenses were permanently cleansed from public git history on 2026-09-23 using `git-filter-repo`.

3. **Tier 3: Packaging & Release Distribution Isolation:**
   - All test fixtures, benchmark corpora, and raw developer assets in `backend/tests/fixtures/` are **100% excluded** from the final desktop distribution package (`Omnitome_1.1.0_x64-setup.exe`) and production tarballs.
   - The compiled NSIS installer bundles strictly the Tauri native supervisor, Node.js 22 LTS portable binary, compiled Vite frontend bundle, and the compressed neural sidecar payload (`resources/sidecar.7z`).

---

## 5. Desktop Packaging & Redistribution Specifications

### 5.1 Distribution Payload Integrity
The official desktop distribution (`Omnitome_1.1.0_x64-setup.exe`) is generated through Tauri v2 and packages:
1. **Rust Desktop Shell (`src-tauri`):** Native Windows container and child-process supervisor managing port allocation and tree teardown (`taskkill /F /T`).
2. **Node.js 22 LTS Runtime:** Embedded portable Node.js binary (`resources/node/node.exe`) operating as the sole SQLite WAL writer.
3. **Compiled React 18 Production Frontend:** Static bundle generated via Vite with strict Content Security Policy (`CSP`).
4. **Compressed Neural Sidecar (`resources/sidecar.7z`):** PyInstaller bundle containing Python 3.10+, PyTorch FP16 CUDA runtime, Kokoro-82M, BGE-M3, and PaddleOCR, unpacked on first run via `sevenz-rust` into `%LOCALAPPDATA%\Omnitome\sidecar\`.

### 5.2 Trademark & Branding Guidelines
- **Product Name:** Omnitome™ is the canonical, official product name.
- **Repository Directory:** `Smart-Reader` is maintained as the historical repository identifier for internal codebase consistency.
- **Fair Use:** Community members and contributors may reference the name Omnitome to describe, review, or contribute to the software. Commercial use of the Omnitome brand for independent products or services requires prior written authorization.

---

## 6. Summary of Governance Commitments

| Domain | Governance Policy |
| :--- | :--- |
| **Core Software Codebase** | AGPL-3.0-only open source (Dual-licensing available for enterprise/OEM) |
| **User Uploaded Documents** | 100% retained by user; zero corporate access, storage, or telemetry |
| **Vector Embeddings & Omni Chapters** | 100% owned by user; stored in local SQLite database (`storage/data.db`) |
| **Neural Weights (BGE, Kokoro)** | Permissive open source (MIT / Apache 2.0) |
| **Synthetic Archive Books** | Creative Commons Attribution 4.0 / Public Domain (CC0) |
| **Procedural Sound Stems** | AGPL-3.0-only (algorithmic DSP generation) |
| **Packaging & Distribution** | Standalone NSIS installer; non-distributable test fixtures completely excluded |

---

*Authored and approved by the Omnitome Project Maintainers.*  
*Last codified: October 24, 2026 for Omnitome v1.1.0 Stable Release.*
