<div align="center">
<pre style="background: transparent; border: none; padding: 0; margin: 0;">
 ▗▄▄▖ ▗▄▖ ▗▖  ▗▖▗▄▄▄▖ ▗▄▄▖▗▄▄▄ ▗▄▄▖  ▗▄▖ ▗▄▄▖ 
▐▌   ▐▌ ▐▌▐▛▚▞▜▌  █  ▐▌   ▐▌  █▐▌ ▐▌▐▌ ▐▌▐▌ ▐▌
▐▌   ▐▌ ▐▌▐▌  ▐▌  █  ▐▌   ▐▌  █▐▛▀▚▖▐▌ ▐▌▐▛▀▘ 
▝▚▄▄▖▝▚▄▞▘▐▌  ▐▌▗▄█▄▖▝▚▄▄▖▐▙▄▄▀▐▌ ▐▌▝▚▄▞▘▐▌   
  
</pre>
</div>


<div align="center">
<a href="https://www.codefactor.io/repository/github/akwastaken/comicdrop/overview/main"><img src="https://www.codefactor.io/repository/github/akwastaken/comicdrop/badge/main" alt="CodeFactor" /></a>
</div>

A lightning-fast, privacy-focused, browser-based comic book reader designed for seamless digital archive viewing. Built entirely around an **offline-first, client-side** architecture, ComicDrop processes, unpacks, and caches archives completely within the browser environment, meaning your data never leaves your device.

---

## The Local-First Architecture

Unlike traditional web applications that upload your archives to a backend server for decompression, ComicDrop turns your browser into a native desktop-class engine.

### Why Offline-First Matters:

* **Zero Latency:** Decompression and parsing occur right inside your machine's memory loop. Pages load instantly without waiting on network buffers or data streaming pipes.
* **Absolute Privacy:** Your digital comic collection remains 110% private. Because there is no remote server processing the files, your data is completely secure from external trackers or cloud storage leaks.
* **Pristine Resource Management:** The app leverages **lazy-extraction matching** combined with a **sliding-window cache memory model**. Instead of inflating a massive 500MB archive all at once into your RAM, it keeps only your current page, one preceding page, and two upcoming pages decompressed. Old pages have their memory blobs instantly revoked, keeping mobile browsers fast and stable.

---

## Features

* **Universal Archive Handling:** Full local decompression pipelines for `.cbz`/`ZIP`, `.cbr`/`RAR`, and `.cb7`/`7z` file structures.
* **System Control Capsule:** A floating top-center utility hub featuring a native "Hide UI" reading immersion mode and dynamic hardware verification to toggle Fullscreen options across supported platforms.
* **Adaptive Control Deck:** Centralized navigation controls right at the bottom edge containing quick page jump sequences, fluid first/last directory bounds, and direct manual page editing.
* **Responsive Layout Dynamics:** Built using explicit dynamic viewport rules (`100dvh`) to center imagery accurately on narrow frames and prevent layout hiding bugs in mobile Safari.
* **Touch & Gesture Mapping:** Fully integrated with swipe gesture recognition models for page flipping and responsive native double-tap trackers to instantly clear zoom matrices.

---

## Usage & Navigation

1. **Launch:** Open `index.html` inside any modern web browser.
2. **Import:** Drag and drop your archive asset anywhere onto the central target zone, or click the explicit input file button selector.
3. **Immersive Navigation:**
* **Keyboard:** Use `Left Arrow` / `Right Arrow` for sequential flips, and `Home` / `End` to jump to directory limits.
* **Touch:** Swipe horizontally across the page layer to navigate. Double-tap anywhere to reset magnification profiles instantly.
* **Interface:** Tap anywhere on your screen to reveal hidden navigation decks on demand.



---

## Requirements

* A modern web browser supporting WebAssembly execution structures and dynamic viewport configurations (Chrome, Firefox, Safari, Edge).
* Absolutely **zero network connectivity required** after the initial application assets are cached.

---

## Credits

* **`unarchiver.js`**: Core stream parsing engine for standard structural unzipping.
* **`jszip`**: Local execution plugins for managing structured ZIP layouts.
* **`7z-wasm`**: Low-level WebAssembly port of the 7zz architecture mapping high-performance 7-Zip file system extraction routines straight onto your GPU thread.
