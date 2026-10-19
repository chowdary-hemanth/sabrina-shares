# Sabrina Shares 🕊️📱

**Sabrina Shares** is an offline, air-gapped, zero-persistence file transfer tool designed to transmit files of up to 10 MB between two devices across an optical visual data channel using a cycling stream of QR codes.

The sender screen rapidly flashes QR frames; the receiver's camera scans them and reconstructs the original file byte-for-byte.

---

## 🔒 Security & Privacy Guarantees

- **Zero Network Activity**: Protected by strict Content Security Policy (CSP):
  `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; worker-src blob:; connect-src 'none'`
  No analytics, no telemetry, no CDNs, no external fonts, no fetches, no WebSockets.
- **Zero Persistence**: 100% volatile memory only. No `localStorage`, no `sessionStorage`, no `IndexedDB`, no cookies, no Cache API, and no service workers.
- **Wipe Session**: One-click "Wipe Session" button immediately zeroes all TypedArray buffers in RAM (`.fill(0)`), terminates Web Workers, terminates camera media streams, releases wake locks, and resets state. An automatic wipe option is also provided after downloading the received file.
- **One-Way Channel (Diode)**: Strictly screen-to-camera. Reliability comes purely from forward error correction and rateless fountain coding, not acknowledgment packets or backchannels.

---

## ⚙️ Architecture & Pipeline

```
[ Sender Device ]
  1. File Input (max 10 MB)
  2. Optional Deflate Compression (via fflate)
  3. Optional AES-256-GCM Encryption (PBKDF2-SHA256, 200,000+ iterations)
  4. Block Partitioning (Fixed block size B)
  5. Luby Transform (LT) Fountain Encoding (Robust Soliton distribution)
  6. Fixed-Timestep Ring Buffer Renderer (requestAnimationFrame)
  7. High-Contrast QR Code Flash Stream (1x1, 2x2, or 3x3 grid)
         │
         │  Optical Screen-to-Camera One-Way Channel
         ▼
[ Receiver Device ]
  1. Camera Stream (1080p+, continuous autofocus)
  2. Hardware BarcodeDetector (with Web Worker jsQR tile fallback)
  3. CRC32 Integrity & Session Filtering
  4. Web Worker Peeling Decoder (Indexed Ripple Queue + Uint32Array XOR)
  5. Concatenation & AES-256-GCM Decryption (Prompt for passphrase)
  6. Deflate Inflation
  7. Plaintext SHA-256 Verification vs Sender Signature
  8. Blob Download & Instant Memory Wipe
```

---

## 📦 Packet Binary Layout (Byte Mode)

Every QR code carries a packed binary packet with 32-bit CRC protection:

### Data Packet
| Offset (Bytes) | Field | Type | Description |
|---|---|---|---|
| 0 | Magic | uint8 | `0x53` ('S') |
| 1 | Version | uint8 | `0x01` |
| 2 | Packet Type | uint8 | `0x01` (Data) |
| 3 | Flags | uint8 | Reserved |
| 4 – 7 | Session ID | uint32 (BE) | Random 32-bit transfer session |
| 8 – 11 | Total Blocks ($K$) | uint32 (BE) | Number of source blocks |
| 12 – 13 | Block Size ($B$) | uint16 (BE) | Size of each block in bytes |
| 14 – 15 | Reserved | uint16 (BE) | Alignment padding |
| 16 – 19 | Packet Seed | uint32 (BE) | Deterministic PRNG seed for degree & neighbors |
| 20 – (20+$B$-1) | Encoded Payload | bytes | XOR sum of neighbor source blocks |
| (20+$B$) – (23+$B$) | CRC32 | uint32 (BE) | IEEE 802.3 CRC over bytes [0 .. 20+$B$-1] |

### Metadata Packet (Emitted ~1x per second)
| Offset (Bytes) | Field | Type | Description |
|---|---|---|---|
| 0 – 15 | Header | 16 bytes | Same header as Data Packet (Type = `0x00`) |
| 16 – 19 | Original Size | uint32 (BE) | Original uncompressed/unencrypted size |
| 20 – 23 | Processed Size | uint32 (BE) | Post-compression/encryption size |
| 24 | Is Compressed | uint8 | 1 if deflated, 0 if raw |
| 25 | Is Encrypted | uint8 | 1 if AES-256-GCM, 0 if raw |
| 26 – 41 | Salt | 16 bytes | PBKDF2 salt |
| 42 – 53 | IV | 12 bytes | AES-GCM 96-bit initialization vector |
| 54 – 85 | SHA-256 | 32 bytes | Cryptographic digest of final plaintext |
| 86 | MIME Length ($M$) | uint8 | Byte length of MIME string |
| 87 – (86+$M$) | MIME Type | ASCII string | MIME type (e.g. `application/pdf`) |
| Next byte | Filename Length ($F$) | uint8 | Byte length of filename |
| Next $F$ bytes | Filename | UTF-8 string | File name |
| Last 4 bytes | CRC32 | uint32 (BE) | IEEE 802.3 CRC over all preceding bytes |

---

## 🚀 Throughput Presets

| Preset | Grid Layout | FPS | Block Size ($B$) | QR Version / ECC | Best Used For |
|---|---|---|---|---|---|
| **🛡️ Reliable** | 1x1 (Single) | 8 FPS | 512 Bytes | v22 / ECC M | Dim light, older cameras, long distance (1–2m) |
| **⚖️ Balanced** | 2x2 (4 QRs) | 10 FPS | 280 Bytes | v12 / ECC L | High-resolution phone cameras at arm's length |
| **⚡ Fast** | 3x3 (9 QRs) | 12 FPS | 160 Bytes | v8 / ECC L | High-speed desktop monitors to 1080p/4K sensors |

---

## 🧪 Self-Tests & Loopback Simulation

- **Loopback Mode**: In the "Loopback & Tests" tab, simulate transmitting 100 KB, 1 MB, 5 MB, or 10 MB files with configurable random packet loss (0% to 40%). Zero camera required.
- **Automated Self-Tests**: Run the built-in test suite to verify:
  1. 10 MB buffer peeling decode under 30% drop rate.
  2. CRC32 corruption rejection.
  3. Wrong session ID rejection.
  4. Duplicate seed deduplication.
  5. WebCrypto AES-256-GCM + PBKDF2 (200k iter) round trip.
  6. Fountain stream late-join recovery.

To run via DevTools console:
```js
window.SabrinaTests.runAll();
```

---

## 📄 License
MIT License. Self-contained, zero dependencies, inlined MIT libraries (`qrcode`, `jsqr`, `fflate`).
