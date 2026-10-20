# Sabrina Shares

sabrina-shares.hemanthchowdary7406.workers.dev

**Sabrina Shares** is an offline, zero-persistence file transfer tool designed to transmit files of up to 10 MB between two devices across an optical visual data channel using a rapidly cycling stream of QR codes.

The sender screen flashes high-contrast QR frames; the receiver's camera scans them and reconstructs the original file byte-for-byte.

- **Zero Network Activity**: Hard platform-level isolation via strict Content Security Policy (`connect-src 'none'`).
- **Zero Persistent Storage**: Pure volatile memory only (no `localStorage`, cookies, or `IndexedDB`).
- **One-Way Channel (Optical Diode)**: Screen to camera. No reverse radio, Wi-Fi, or Bluetooth channel.
- **Rateless Fountain Codes**: Luby Transform (LT) codes with Robust Soliton distribution. Start at any frame, miss any packets, and finish automatically.
- **Progressive Web App (PWA)**: Installable to home screens; runs 100% offline in airplane mode.
- **Verifiable Cryptographic Integrity**: Every shipped release file is tracked in `HASHES.txt` and verified in CI.

---

## Security & Privacy Architecture

```
[ Sender Device ]
  1. File Selection (max 10 MB limit enforced)
  2. Optional Deflate Compression (via fflate; skipped if output is not smaller)
  3. Optional AES-256-GCM Encryption (PBKDF2-SHA256, 200,000+ iterations, salt + 96-bit IV)
  4. Block Partitioning (Fixed block size B, zero-padded end block)
  5. Luby Transform (LT) Fountain Encoding (Robust Soliton distribution, Mulberry32 PRNG)
  6. Fixed-Timestep Ring Buffer Renderer (requestAnimationFrame accumulator)
  7. High-Contrast QR Code Flash Stream (1x1, 2x2, or 3x3 grid)
         │
         │  Optical Screen-to-Camera One-Way Channel (Zero Backchannel)
         ▼
[ Receiver Device ]
  1. Camera Stream (1080p+, continuous autofocus, rear sensor)
  2. QR Detection Engine (Native BarcodeDetector / Web Worker jsQR tile fallback)
  3. Packet Integrity & Session Filter (CRC32 checksum, Session ID match, Dedup)
  4. Web Worker Peeling Decoder (Indexed Ripple Queue + Uint32Array XOR)
  5. Concatenation & AES-256-GCM Decryption (Prompt for passphrase if encrypted)
  6. Deflate Inflation
  7. Plaintext SHA-256 Verification vs Sender Signature
  8. Download Blob & Instant Memory Wipe
```

### Content Security Policy (CSP)
```http
Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline' https://www.ascii-magic.com; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; manifest-src 'self'; worker-src 'self' blob:; connect-src 'self' https://www.ascii-magic.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none';
```
- `connect-src 'self' https://www.ascii-magic.com`: Allows only local app shell revalidation and ASCII Magic binary-stars piece loading. Browser refuses all arbitrary analytics, tracking, or network exfiltration.
- `manifest-src 'self'` & `worker-src 'self' blob:`: Permits the offline service worker and local blob Web Workers while forbidding any external worker execution.
- `frame-ancestors 'none'`: Prevents clickjacking by forbidding embedding inside `<iframe>`.
- `base-uri 'none'` & `form-action 'none'`: Blocks `<base>` tag injection and form submissions.

---

## 🔍 Verify Your Copy (Integrity & Trust)

You can verify that the code executing on your device matches the published repository before transferring sensitive data.

### 1. Verification via macOS / Linux Terminal
Clone the repository and compare file hashes against `HASHES.txt`:
```bash
# Verify all assets against the manifest
node scripts/hash.mjs --check

# Or verify index.html directly using sha256sum
sha256sum index.html
cat HASHES.txt | grep index.html
```

### 2. Verification via Windows PowerShell
```powershell
# Verify index.html hash
Get-FileHash -Algorithm SHA256 index.html
Get-Content HASHES.txt | Select-String "index.html"
```

### 3. Verification in Browser DevTools Console
Press `F12` (or `Cmd+Option+I` on macOS) -> **Console** on any loaded instance of Sabrina Shares:
```javascript
fetch('index.html')
  .then(res => res.arrayBuffer())
  .then(buf => crypto.subtle.digest('SHA-256', buf))
  .then(hash => {
    const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log("Current running index.html SHA-256:\n" + hex);
  });
```
Compare the resulting hash against the entry in `HASHES.txt`.

### 4. Verifying Signed Release Tags
Official releases are tagged in git and signed with a cryptographic key:
```bash
git tag -v v1.0.0
```

---

## 💻 Local Offline Execution (Maximum Trust)

For classified or air-gapped environments, you do not need to rely on any remote host. Run Sabrina Shares on an air-gapped computer:

```bash
# Clone or copy the folder
cd sabrina-shares

# Start a local offline HTTP server (Python 3)
python -m http.server 8080 --bind 127.0.0.1
```
Open `http://localhost:8080` in Chrome, Safari, Edge, or Firefox. Because camera access requires a secure origin, modern browsers treat `localhost` / `127.0.0.1` as a secure context, enabling camera input and service workers offline.

---

## 📱 Progressive Web App (PWA) Offline Installation

1. **Android (Chrome)**:
   - Visit the deployment URL over HTTPS.
   - Tap the **📲 Install** button in the top navigation bar, or select **Add to Home screen** from the Chrome menu.
   - Once installed, enable **Airplane Mode** (disable Wi-Fi and Cellular).
   - Launch Sabrina Shares from your app drawer. It will launch as a standalone app and function 100% offline.
2. **iOS (Safari)**:
   - Visit the deployment URL over HTTPS in Safari.
   - Tap the **Share** button (box with upward arrow) -> **Add to Home Screen**.
   - Launch Sabrina Shares from the Home Screen.
3. **Desktop (Chrome / Edge)**:
   - Click the install icon in the address bar.

---

## 🚀 Cloudflare Pages Production Deployment Runbook

Cloudflare Pages provides global Edge hosting with HTTP/3, free automatic SSL certificates, and zero cold starts.

### Route 1: Git-Connected (Automatic CI/CD)
1. Fork or push this repository to your GitHub account (`https://github.com/<your-username>/sabrina-shares`).
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select the `sabrina-shares` repository.
4. Set up the build configuration:
   - **Project Name**: `sabrina-shares`
   - **Production Branch**: `main`
   - **Framework Preset**: `None`
   - **Build Command**: *(leave completely blank)*
   - **Build Output Directory**: `/`
5. Click **Save and Deploy**. Your site will deploy in seconds at `https://sabrina-shares.pages.dev`.

### Route 2: Direct Upload via Wrangler CLI
Deploy directly from your local terminal without connecting GitHub:
```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Login to Cloudflare
npx wrangler login

# 3. Deploy directory to Cloudflare Pages
npx wrangler pages deploy . --project-name=sabrina-shares --branch=main
```

### ⚠️ Critical Cloudflare Settings: Disabling Auto-Injected Scripts
Because Sabrina Shares uses a strict zero-network CSP (`connect-src 'none'`), third-party scripts injected by Cloudflare will be blocked and log CSP violations.

1. **Disable Cloudflare Web Analytics**:
   - In Cloudflare Dashboard -> **Analytics & Logs** -> **Web Analytics**.
   - Ensure Web Analytics is **disabled** for your Pages domain.
2. **Disable Rocket Loader & Auto Minify** (if using custom domain):
   - Under **Speed** -> **Optimization**, turn **Rocket Loader** OFF.
   - Under **Scrape Shield**, turn **Email Address Obfuscation** OFF.
3. **Verify Zero Injection**:
   - Run `curl -s https://sabrina-shares.pages.dev | grep -i "cloudflare"` to confirm no scripts are injected.

### Custom Domain & HSTS Preload
1. Under **Custom domains** in your Pages project, click **Set up a domain** (e.g. `shares.yourdomain.com`).
2. Cloudflare automatically configures DNS CNAME records and issues a managed TLS certificate.
3. In **SSL/TLS** -> **Edge Certificates**, enable **Always Use HTTPS** and **HTTP Strict Transport Security (HSTS)** with:
   - Max-Age: `63072000` (2 years)
   - Include subdomains: `true`
   - Preload: `true`

---

## ⚡ Fallback Hosts

### 1. Netlify
A [`netlify.toml`](netlify.toml) file is included in the repository. Run:
```bash
npx netlify deploy --prod --dir=.
```

### 2. GitHub Pages
GitHub Pages serves static sites from the `main` branch.
- *Limitation*: GitHub Pages does not support custom response headers (`_headers`), so security policies fall back to the inlined `<meta http-equiv="Content-Security-Policy">` tag in `index.html`.

---

## 🧪 Automated Self-Tests Suite

Sabrina Shares includes a built-in cryptographic test suite:
- **Test 1**: 10 MB buffer peeling decode under 30% random packet drop.
- **Test 2**: CRC32 bit corruption rejection.
- **Test 3**: Wrong session ID packet rejection.
- **Test 4**: Duplicate seed deduplication.
- **Test 5**: WebCrypto AES-256-GCM + PBKDF2 (200k iter) roundtrip.
- **Test 6**: Fountain stream late-join recovery.

To run tests in browser console:
```javascript
window.SabrinaTests.runAll();
```

---

## 📄 License
MIT License. Copyright (c) 2026 Hemanth Chowdary.
