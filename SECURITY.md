# Security Policy

## Reporting Security Vulnerabilities

The security and privacy of Sabrina Shares users is paramount. If you discover a vulnerability, weakness, or CSP circumvention, please report it privately:

- **Security Contact**: `hemanthchowdary7406@gmail.com`
- **PGP Fingerprint**: (Available upon request)
- **Response SLA**: Initial triage within 24 hours; fixes pushed within 72 hours.

Please do not open public issues for security vulnerabilities until an advisory and fix have been coordinated.

---

## Security Architecture & Threat Model

Sabrina Shares is engineered under the assumption of a hostile, monitored, or untrusted network environment.

### 1. Zero Network Activity
- Enforced at the platform level using a strict Content Security Policy (CSP):
  `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: blob:; manifest-src 'self'; worker-src 'self' blob:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none';`
- The `connect-src 'none'` directive ensures the browser refuses any attempt to initiate `fetch()`, `XMLHttpRequest`, `WebSocket`, `EventSource`, or beacon requests.
- No analytics scripts, third-party CDNs, telemetry, or external web fonts are permitted.

### 2. Zero Persistent Storage
- No data is ever written to `localStorage`, `sessionStorage`, `IndexedDB`, WebSQL, or cookies.
- All file chunks, QR codes, video frames, and keys reside strictly in ephemeral volatile JavaScript RAM (`Uint8Array`, `ArrayBuffer`).
- The **Wipe Session** feature actively overwrites memory buffers with zeros (`.fill(0)`) before terminating Web Workers and refreshing the environment.

### 3. One-Way Optical Diode
- Transmission is physically bounded by line-of-sight optical photons (screen to camera).
- The receiver never transmits optical or radio signals back to the sender.
- Reliability is achieved strictly through forward error correction (Luby Transform fountain coding with Robust Soliton distribution).

### 4. Cryptographic Pipeline
- **Confidentiality**: Optional end-to-end encryption using AES-256-GCM. Keys are derived via PBKDF2 using SHA-256 with 200,000+ iterations, a unique 128-bit salt, and a 96-bit random initialization vector (IV) per transfer.
- **Integrity**: Plaintext payloads are cryptographically hashed using SHA-256. The receiver verifies this signature before exposing the download Blob.

### 5. Honest Host Trust Model
- A web host (such as Cloudflare Pages or GitHub Pages) could theoretically attempt to serve modified JavaScript to a specific user.
- To counter this, Sabrina Shares provides:
  - Cryptographic release manifests (`HASHES.txt`) signed via Git tags.
  - One-line verification commands in terminal and browser DevTools.
  - Installable PWA support: Once cached and verified, the application works 100% offline in airplane mode, immune to future host tampering.
  - Independent local execution: The single HTML file can be audited and served completely offline via `python -m http.server` on an air-gapped machine.
