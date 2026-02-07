# MKV Wrapper Pro 💿

![Version](https://img.shields.io/badge/version-1.0.0-emerald)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/Frontend-React%2019-black?logo=react)
![Node](https://img.shields.io/badge/Backend-Express-black?logo=node.js)

**MKV Wrapper Pro** is a sophisticated, high-performance media archival suite designed to bridge the gap between physical media and digital libraries. Built with a robust **Finite State Machine (FSM)** architecture, it automates the interrogation, metadata enrichment, and bit-perfect extraction of optical media via the industry-standard MakeMKV engine.

---

## ✨ Key Features

### 🧠 Intelligent Archival Logic
- **Finite State Machine (FSM):** Orchestrates the complex lifecycle of a disc rip—from hardware detection and TOC analysis to batch processing and library ingestion.
- **Smart Title Selection:** Automatically identifies the main feature versus "bonus content" using duration-based confidence scoring.
- **TV Series Mapping:** Integrated episode mapping for multi-title discs, allowing you to assign specific tracks to seasons and episode numbers.

### 🌐 Metadata Enrichment
- **TMDB Integration:** Automated fetching of high-resolution posters, synopses, and release years.
- **Gemini AI Support:** (Optional) Advanced disc-label parsing using Google Gemini for difficult-to-identify media.
- **Manual Override:** Robust search interface for manual metadata correction.

### 🛠️ Hardware Bridge
- **Real-time I/O Monitoring:** Live streaming logs directly from the `makemkvcon` process into the UI.
- **Automated Workflows:** Configurable auto-eject on completion and automated folder structuring based on media metadata.
- **Stream Control:** Fine-grained selection of audio codecs and subtitle tracks before the archival process begins.

---

## 🚀 Quick Start Guide

Follow these steps to deploy your local media archival station.

### 1. Prerequisites
Before running the application, ensure you have the following installed:

*   **[MakeMKV](https://www.makemkv.com/download/):** The core extraction engine. Ensure the `makemkvcon.exe` is present (usually in `C:\Program Files (x86)\MakeMKV`).
*   **[Node.js (v18+)](https://nodejs.org/):** Required for the hardware bridge server.
*   **TMDB API Key:** Register for a free account at [TheMovieDB.org](https://www.themoviedb.org/documentation/api) to obtain an API key for metadata fetching.

### 2. Installation

Clone the repository to your local machine:

```bash
git clone https://github.com/your-username/mkv-wrapper-pro.git
cd mkv-wrapper-pro
```

Install the dependencies:

```bash
npm install
```

### 3. Build & Launch

Generate the optimized production UI:

```bash
npm run build
```

Start the integrated session:

```bash
npm start
```

*The application will launch on `http://localhost:5005`.*

---

## ⚙️ Configuration

On the first launch, you will be guided through the **Onboarding Wizard**:
1.  **API Key:** Enter your TMDB V3 API Key.
2.  **Binary Path:** Point the app to your `makemkvcon.exe` location.
3.  **Output Path:** Set the master directory where your library will be stored.

---

## 🛠️ Technical Stack

- **Frontend:** React 19, Tailwind CSS, Lucide Icons.
- **State Management:** React `useReducer` with FSM patterns.
- **Backend:** Node.js, Express, Child Process Spawning.
- **Data:** Local JSON storage for library persistence.

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Designed with precision for the modern media enthusiast.*