# WhatsApp Database Viewer (Web-Based) 🟢💬

An interactive, client-side web application to open, decrypt, and view WhatsApp chat histories directly from Android databases (`msgstore.db`, `.crypt12`, `.crypt14`, and `.crypt15`) featuring an authentic **WhatsApp Web** interface.

---

## 🌟 Key Features

1. **Intuitive 3-Step Flow**:
   - **Step 1 (Default)**: Clean start screen featuring the Database Upload dropzone and a comprehensive guide on retrieving database and key files from Android devices.
   - **Step 2 (Key Prompt)**: When an encrypted backup (`.crypt12`, `.crypt14`, `.crypt15`) is uploaded, the app prompts for the `key` file (158 bytes / 32 bytes) or a 64-character hexadecimal key. (If an unencrypted SQLite `msgstore.db` is uploaded, this step is automatically bypassed).
   - **Step 3 (Interactive Chat View)**: Unlocks the conversation history rendered in a pixel-perfect WhatsApp Web layout.

2. **100% Client-Side & Private**:
   - Cryptographic decryption (AES-GCM, AES-CTR, HKDF-SHA256) and SQLite queries execute entirely inside your local browser using the **WebCrypto API** and **WebAssembly (SQL.js)**.
   - Zero bytes of chat records, media metadata, or secret keys are ever transmitted over the network or stored on any server.

3. **Authentic WhatsApp Web Experience**:
   - **Conversation Sidebar**: Real-time search, category filters (*All*, *Unread*, *Groups*, *Contacts*), unread count badges, pin icons, color-coded avatars, and last message previews with delivery ticks (`✓✓`).
   - **Full Unlimited Message History**: No artificial message caps (`LIMIT 300` removed); conversations load smoothly on-demand with DOM fragment optimization.
   - **Local Media Linking & Drag & Drop**:
     - Direct **"📁 Locate File"** button on missing media cards to immediately attach specific photos from your computer.
     - Direct **Drag & Drop** of photos, videos, documents, or your `WhatsApp Images` folder directly onto the chat window.
     - Automatic in-memory extraction of backup **`.zip` archives** (e.g. from Google Drive or device backup).
     - Modern File System Access API support (`showDirectoryPicker`) for linking your local `WhatsApp/Media` folder.
   - **Rich Message Types**:
     - Formatted text supporting WhatsApp markdown (`*bold*`, `_italic_`, `~strikethrough~`, ````code````) and auto-linked URLs.
     - Photo messages with captions and an interactive lightbox modal preview.
     - Voice notes with animated waveform visualizers and simulated audio playback.
     - Document attachments (PDF/DOC) displaying filename and file size.
     - Location cards with map pins and addresses.
     - Transparent stickers.
     - Quoted reply previews.
   - **In-Chat Search**: Instant keyword search within the selected chat with active occurrence counter and highlight navigation.
   - **Contact & Group Info Drawer**: View phone numbers, group member lists, and statuses.
   - **Theme Customization**: Dark Mode & Light Mode support matching official WhatsApp design tokens.
   - **Export Options**: Export active chat to `.txt` or the entire database to `.json`.
   - **"Try Demo 🚀" Button**: Explore all features immediately with pre-loaded mock data.

---

## 🌐 Deploy to GitHub Pages (Live Web Demo)

Because this application runs **100% client-side with zero build step required**, you can host it freely on **GitHub Pages**:

1. Go to your repository **Settings** on GitHub.
2. Under the **Code and automation** section in the left sidebar, click **Pages**.
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **`main`** / Folder: **`/ (root)`**
4. Click **Save**. Your WhatsApp Viewer will be live at `https://<username>.github.io/<repository-name>/`!

---

## 🚀 Getting Started Locally

This application is built with vanilla **HTML5, Vanilla CSS, and JavaScript**. You can run it locally with any web server:

### Option 1: Direct Local Server (Recommended)
Open a terminal in the project directory and run:

```bash
# Using npx serve
npx serve . -l 3000

# Or using Python 3
python3 -m http.server 3000
```
Then navigate to: **`http://localhost:3000`** in Google Chrome, Safari, or Firefox.

### Option 2: Direct File Open
Double-click `index.html` or drag it into your web browser.

---

## 📂 Project Structure

| File | Description |
| :--- | :--- |
| [`index.html`](file:///Users/masdikaid/WebstormProjects/waviewer/index.html) | Single-page HTML5 structure (Upload screen, Key modal, WhatsApp Web workspace) |
| [`style.css`](file:///Users/masdikaid/WebstormProjects/waviewer/style.css) | Vanilla CSS styling WhatsApp Web theme (Dark/Light mode, bubble tails, doodle wallpaper) |
| [`app.js`](file:///Users/masdikaid/WebstormProjects/waviewer/app.js) | Core application controller, SQLite database parser, UI renderer, and event handlers |
| [`decryptor.js`](file:///Users/masdikaid/WebstormProjects/waviewer/decryptor.js) | WebCrypto cryptographic engine for Crypt12/Crypt14/Crypt15 decryption and key extraction |
| [`demo-data.js`](file:///Users/masdikaid/WebstormProjects/waviewer/demo-data.js) | Rich simulated WhatsApp conversations dataset with multimedia messages |
| [`package.json`](file:///Users/masdikaid/WebstormProjects/waviewer/package.json) | Local scripts and package configuration |
