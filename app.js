/**
 * WhatsApp Database Viewer - Core Application Controller
 * Manages flow: Upload -> Request Key -> WhatsApp Web Chat Interface
 */

(function () {
  'use strict';

  // Application State
  const state = {
    view: 'UPLOAD', // 'UPLOAD' | 'KEY_MODAL' | 'CHAT_VIEW'
    dbFile: null,
    dbBytes: null,
    dbFileName: '',
    dbFileType: 'auto',
    keyInput: null,
    chats: [],
    activeChatId: null,
    activeFilter: 'all',
    searchQuery: '',
    inChatSearchQuery: '',
    audioPlayingMsgId: null,
    audioInterval: null,
    audioProgress: 0,
    activeAudioEl: null,
    theme: localStorage.getItem('wa_theme') || 'dark',
    sqlEngine: null,
    sqliteDb: null,
    dbSchema: null,
    schemaInfo: null,
    mediaFilesMap: new Map(),
    mediaFilesBySize: new Map(),
    mediaFilesList: []
  };

  // DOM Elements
  const dom = {
    app: document.getElementById('app'),
    viewUpload: document.getElementById('viewUpload'),
    keyModal: document.getElementById('keyModal'),
    viewWhatsApp: document.getElementById('viewWhatsApp'),
    
    // Upload & Guide
    dbDropzone: document.getElementById('dbDropzone'),
    dbFileInput: document.getElementById('dbFileInput'),
    btnBrowseDb: document.getElementById('btnBrowseDb'),
    btnLoadDemo: document.getElementById('btnLoadDemo'),
    guideTabBtns: document.querySelectorAll('.guide-tab-btn'),
    guideTabContents: document.querySelectorAll('.guide-tab-content'),
    copyButtons: document.querySelectorAll('.btn-copy-code'),

    // Key Modal
    targetFileName: document.getElementById('targetFileName'),
    targetFileSize: document.getElementById('targetFileSize'),
    keyDropzone: document.getElementById('keyDropzone'),
    keyFileInput: document.getElementById('keyFileInput'),
    hexKeyInput: document.getElementById('hexKeyInput'),
    keyFilePromptTitle: document.getElementById('keyFilePromptTitle'),
    keyFilePromptSub: document.getElementById('keyFilePromptSub'),
    keyStatusAlert: document.getElementById('keyStatusAlert'),
    keyStatusText: document.getElementById('keyStatusText'),
    btnCancelKey: document.getElementById('btnCancelKey'),
    btnCloseKeyModal: document.getElementById('btnCloseKeyModal'),
    btnDecryptSubmit: document.getElementById('btnDecryptSubmit'),
    decryptBtnText: document.getElementById('decryptBtnText'),
    decryptSpinner: document.getElementById('decryptSpinner'),

    // WhatsApp View
    sidebar: document.getElementById('sidebar'),
    chatList: document.getElementById('chatList'),
    chatSearchInput: document.getElementById('chatSearchInput'),
    filterChips: document.querySelectorAll('.filter-chip'),
    loadedDbName: document.getElementById('loadedDbName'),
    emptyChatState: document.getElementById('emptyChatState'),
    activeChatContainer: document.getElementById('activeChatContainer'),
    activeChatAvatar: document.getElementById('activeChatAvatar'),
    activeChatTitle: document.getElementById('activeChatTitle'),
    activeChatSub: document.getElementById('activeChatSub'),
    messagesViewport: document.getElementById('messagesViewport'),
    activeMsgCount: document.getElementById('activeMsgCount'),
    btnBackToList: document.getElementById('btnBackToList'),

    // In-Chat Search
    btnToggleInChatSearch: document.getElementById('btnToggleInChatSearch'),
    inChatSearchBar: document.getElementById('inChatSearchBar'),
    inChatSearchInput: document.getElementById('inChatSearchInput'),
    inChatSearchMatches: document.getElementById('inChatSearchMatches'),
    btnCloseInChatSearch: document.getElementById('btnCloseInChatSearch'),

    // Drawer & Modals
    infoDrawer: document.getElementById('infoDrawer'),
    infoDrawerTitle: document.getElementById('infoDrawerTitle'),
    btnToggleInfoDrawer: document.getElementById('btnToggleInfoDrawer'),
    btnCloseInfoDrawer: document.getElementById('btnCloseInfoDrawer'),
    infoAvatar: document.getElementById('infoAvatar'),
    infoName: document.getElementById('infoName'),
    infoPhone: document.getElementById('infoPhone'),
    infoAbout: document.getElementById('infoAbout'),
    infoParticipantsBox: document.getElementById('infoParticipantsBox'),
    infoParticipantsList: document.getElementById('infoParticipantsList'),

    btnExportChat: document.getElementById('btnExportChat'),
    btnExportAll: document.getElementById('btnExportAll'),
    btnLinkMedia: document.getElementById('btnLinkMedia'),

    // Media Folder Modal & Tools
    mediaModal: document.getElementById('mediaModal'),
    btnCloseMediaModal: document.getElementById('btnCloseMediaModal'),
    btnCloseMediaModalFooter: document.getElementById('btnCloseMediaModalFooter'),
    mediaDropzone: document.getElementById('mediaDropzone'),
    mediaFolderPicker: document.getElementById('mediaFolderPicker'),
    mediaFilesPicker: document.getElementById('mediaFilesPicker'),
    mediaZipPicker: document.getElementById('mediaZipPicker'),
    singleMediaPicker: document.getElementById('singleMediaPicker'),
    btnSelectFolder: document.getElementById('btnSelectFolder'),
    btnSelectFiles: document.getElementById('btnSelectFiles'),
    btnSelectZip: document.getElementById('btnSelectZip'),
    mediaStatusBox: document.getElementById('mediaStatusBox'),
    mediaStatusText: document.getElementById('mediaStatusText'),
    mediaStatusBreakdown: document.getElementById('mediaStatusBreakdown'),
    mediaStatusWarning: document.getElementById('mediaStatusWarning'),
    mediaMissingChatSection: document.getElementById('mediaMissingChatSection'),
    mediaMissingCount: document.getElementById('mediaMissingCount'),
    mediaMissingList: document.getElementById('mediaMissingList'),
    btnClearMedia: document.getElementById('btnClearMedia'),
    chatDropOverlay: document.getElementById('chatDropOverlay'),
    mainChatWindow: document.querySelector('.main-chat-window'),

    imageLightboxModal: document.getElementById('imageLightboxModal'),
    lightboxImage: document.getElementById('lightboxImage'),
    lightboxCaption: document.getElementById('lightboxCaption'),
    btnCloseLightbox: document.getElementById('btnCloseLightbox'),

    // Global Nav
    btnThemeToggle: document.getElementById('btnThemeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    btnChangeDb: document.getElementById('btnChangeDb'),
    toastContainer: document.getElementById('toastContainer')
  };

  /* ==========================================================================
     INIT & THEME SETUP
     ========================================================================== */
  function initApp() {
    applyTheme(state.theme);
    bindEvents();
    renderView();
  }

  function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem('wa_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('theme-light');
      dom.themeIcon.innerHTML = `<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0z"/>`;
    } else {
      document.body.classList.remove('theme-light');
      dom.themeIcon.innerHTML = `<path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>`;
    }
  }

  function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  /* ==========================================================================
     VIEW SWITCHING
     ========================================================================== */
  function renderView() {
    if (state.view === 'UPLOAD') {
      dom.viewUpload.style.display = 'flex';
      dom.keyModal.style.display = 'none';
      dom.viewWhatsApp.style.display = 'none';
      dom.btnChangeDb.style.display = 'none';
    } else if (state.view === 'KEY_MODAL') {
      dom.viewUpload.style.display = 'flex';
      dom.keyModal.style.display = 'flex';
      dom.viewWhatsApp.style.display = 'none';
      dom.btnChangeDb.style.display = 'none';
    } else if (state.view === 'CHAT_VIEW') {
      dom.viewUpload.style.display = 'none';
      dom.keyModal.style.display = 'none';
      dom.viewWhatsApp.style.display = 'flex';
      dom.btnChangeDb.style.display = 'inline-flex';
      renderChatList();
      if (state.activeChatId) {
        selectChat(state.activeChatId);
      } else if (state.chats.length > 0) {
        selectChat(state.chats[0].id);
      }
    }
  }

  /* ==========================================================================
     EVENT LISTENERS
     ========================================================================== */
  function bindEvents() {
    // Theme toggle
    dom.btnThemeToggle.addEventListener('click', toggleTheme);

    // Change database (reset)
    dom.btnChangeDb.addEventListener('click', () => {
      if (confirm('Return to database upload screen?')) {
        resetToUpload();
      }
    });

    // Database Dropzone & File Input
    dom.dbDropzone.addEventListener('click', () => dom.dbFileInput.click());
    dom.btnBrowseDb.addEventListener('click', (e) => {
      e.stopPropagation();
      dom.dbFileInput.click();
    });

    dom.dbFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleDbFileSelected(e.target.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach(name => {
      dom.dbDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dom.dbDropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dom.dbDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dom.dbDropzone.classList.remove('drag-over');
      });
    });

    dom.dbDropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleDbFileSelected(e.dataTransfer.files[0]);
      }
    });

    // Try Demo Database Button
    dom.btnLoadDemo.addEventListener('click', loadDemoDatabase);

    // Guide Tabs
    dom.guideTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        dom.guideTabBtns.forEach(b => b.classList.remove('active'));
        dom.guideTabContents.forEach(c => c.style.display = 'none');
        btn.classList.add('active');
        const content = document.getElementById(targetId);
        if (content) content.style.display = 'block';
      });
    });

    // Copy Path / Command Buttons in Guide
    dom.copyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const textToCopy = btn.getAttribute('data-copy');
        if (navigator.clipboard && textToCopy) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            showToast('Text copied to clipboard!', 'success');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = originalText; }, 2000);
          });
        }
      });
    });

    // Key Modal Dropzone & File Input
    dom.keyDropzone.addEventListener('click', () => dom.keyFileInput.click());
    dom.keyFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleKeyFileSelected(e.target.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach(name => {
      dom.keyDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dom.keyDropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dom.keyDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dom.keyDropzone.classList.remove('drag-over');
      });
    });

    dom.keyDropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleKeyFileSelected(e.dataTransfer.files[0]);
      }
    });

    // Decrypt Submit Button
    dom.btnDecryptSubmit.addEventListener('click', handleDecryptSubmit);
    dom.btnCancelKey.addEventListener('click', closeKeyModal);
    dom.btnCloseKeyModal.addEventListener('click', closeKeyModal);

    // Sidebar Search & Filter
    dom.chatSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderChatList();
    });

    dom.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        dom.filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.activeFilter = chip.getAttribute('data-filter');
        renderChatList();
      });
    });

    // In-Chat Search
    dom.btnToggleInChatSearch.addEventListener('click', () => {
      dom.inChatSearchBar.style.display = dom.inChatSearchBar.style.display === 'none' ? 'flex' : 'none';
      if (dom.inChatSearchBar.style.display === 'flex') {
        dom.inChatSearchInput.focus();
      } else {
        clearInChatSearch();
      }
    });

    dom.btnCloseInChatSearch.addEventListener('click', () => {
      dom.inChatSearchBar.style.display = 'none';
      clearInChatSearch();
    });

    dom.inChatSearchInput.addEventListener('input', (e) => {
      state.inChatSearchQuery = e.target.value.toLowerCase().trim();
      applyInChatSearch();
    });

    // Info Drawer
    dom.btnToggleInfoDrawer.addEventListener('click', toggleInfoDrawer);
    dom.btnCloseInfoDrawer.addEventListener('click', closeInfoDrawer);

    // Mobile Back to List
    dom.btnBackToList.addEventListener('click', () => {
      dom.viewWhatsApp.classList.remove('chat-active');
    });

    // Lightbox Close
    dom.btnCloseLightbox.addEventListener('click', closeLightbox);
    dom.imageLightboxModal.addEventListener('click', (e) => {
      if (e.target === dom.imageLightboxModal) closeLightbox();
    });

    // Export Chat Buttons
    dom.btnExportChat.addEventListener('click', exportActiveChat);
    dom.btnExportAll.addEventListener('click', exportAllChats);

    // Link Local Media Folder Modal & Controls
    if (dom.btnLinkMedia) {
      dom.btnLinkMedia.addEventListener('click', openMediaModal);
    }
    if (dom.btnCloseMediaModal) {
      dom.btnCloseMediaModal.addEventListener('click', closeMediaModal);
    }
    if (dom.btnCloseMediaModalFooter) {
      dom.btnCloseMediaModalFooter.addEventListener('click', closeMediaModal);
    }
    if (dom.mediaModal) {
      dom.mediaModal.addEventListener('click', (e) => {
        if (e.target === dom.mediaModal) closeMediaModal();
      });
    }

    if (dom.btnSelectFolder) {
      dom.btnSelectFolder.addEventListener('click', handleSelectFolderAction);
    }
    if (dom.btnSelectFiles) {
      dom.btnSelectFiles.addEventListener('click', () => {
        if (dom.mediaFilesPicker) dom.mediaFilesPicker.click();
      });
    }
    if (dom.btnSelectZip) {
      dom.btnSelectZip.addEventListener('click', () => {
        if (dom.mediaZipPicker) dom.mediaZipPicker.click();
      });
    }
    if (dom.mediaFilesPicker) {
      dom.mediaFilesPicker.addEventListener('change', handleMediaFilesPickerChange);
    }
    if (dom.mediaFolderPicker) {
      dom.mediaFolderPicker.addEventListener('change', handleMediaFolderPickerChange);
    }
    if (dom.mediaZipPicker) {
      dom.mediaZipPicker.addEventListener('change', handleMediaZipPickerChange);
    }
    if (dom.singleMediaPicker) {
      dom.singleMediaPicker.addEventListener('change', handleSingleMediaPickerChange);
    }
    if (dom.btnClearMedia) {
      dom.btnClearMedia.addEventListener('click', clearLinkedMedia);
    }

    // Media Dropzone Drag & Drop
    if (dom.mediaDropzone) {
      ['dragenter', 'dragover'].forEach(name => {
        dom.mediaDropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dom.mediaDropzone.classList.add('drag-over');
        });
      });
      ['dragleave', 'drop'].forEach(name => {
        dom.mediaDropzone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dom.mediaDropzone.classList.remove('drag-over');
        });
      });
      dom.mediaDropzone.addEventListener('drop', handleMediaDrop);
    }

    // Direct Drag & Drop onto the Chat Window
    setupChatDropOverlay();
  }

  function setupChatDropOverlay() {
    const chatContainer = document.querySelector('.main-chat-window');
    if (!chatContainer) return;

    let dragCounter = 0;

    ['dragenter', 'dragover'].forEach(name => {
      chatContainer.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (name === 'dragenter') dragCounter++;
        if (dom.chatDropOverlay) dom.chatDropOverlay.style.display = 'flex';
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      chatContainer.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (name === 'dragleave') {
          dragCounter = Math.max(0, dragCounter - 1);
          if (dragCounter === 0 && dom.chatDropOverlay) {
            dom.chatDropOverlay.style.display = 'none';
          }
        } else if (name === 'drop') {
          dragCounter = 0;
          if (dom.chatDropOverlay) dom.chatDropOverlay.style.display = 'none';
          handleMediaDrop(e);
        }
      });
    });
  }

  function openMediaModal() {
    if (!dom.mediaModal) return;
    dom.mediaModal.style.display = 'flex';
    updateMediaStatusUI();
  }

  function closeMediaModal() {
    if (!dom.mediaModal) return;
    dom.mediaModal.style.display = 'none';
  }

  window.waOpenMediaModal = openMediaModal;

  /**
   * Normalizes a filename to a stripped-down key for ultra-resilient matching
   * e.g. "IMG-20261005-WA0009.jpg" -> "img20261005wa0009.jpg"
   */
  function normalizeMediaKey(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .trim()
      .replace(/\\/g, '/')
      .replace(/^.*[\\\/]/, '') // basename only
      .replace(/[-_ ]/g, '') // remove hyphens, underscores, spaces
      .replace(/\.jpeg$/, '.jpg');
  }

  function indexMediaFile(file, relativePath = '') {
    if (!file || !file.name) return;
    const nameLower = file.name.toLowerCase();
    const normalized = normalizeMediaKey(file.name);
    
    // 1. Direct lowercase filename
    state.mediaFilesMap.set(nameLower, file);
    state.mediaFilesMap.set(normalized, file);

    // 2. Relative path indexing
    if (relativePath) {
      const relLower = relativePath.toLowerCase();
      state.mediaFilesMap.set(relLower, file);
      state.mediaFilesMap.set(normalizeMediaKey(relativePath), file);
      const parts = relativePath.split(/[\/\\]/);
      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1].toLowerCase();
        state.mediaFilesMap.set(lastPart, file);
        state.mediaFilesMap.set(normalizeMediaKey(lastPart), file);
      }
    }

    // 3. Name without extension
    const dotIdx = nameLower.lastIndexOf('.');
    if (dotIdx > 0) {
      const noExt = nameLower.slice(0, dotIdx);
      state.mediaFilesMap.set(noExt, file);
      state.mediaFilesMap.set(normalizeMediaKey(noExt), file);
    }

    // 4. WhatsApp Sequence & Date Pattern matching
    // Matches patterns like IMG-20261005-WA0009.jpg or VID_20261005_WA0010.mp4
    const waMatch = file.name.match(/(?:IMG|VID|AUD|DOC|PTT|STK)?[-_]?(\d{8})[-_]?(WA\d+|\d+)/i);
    if (waMatch) {
      const datePart = waMatch[1];
      const seqPart = waMatch[2].toLowerCase();
      state.mediaFilesMap.set(`${datePart}_${seqPart}`, file);
      state.mediaFilesMap.set(`${datePart}${seqPart}`, file);
      state.mediaFilesMap.set(seqPart, file);
    }

    // 5. Index by exact byte size
    if (file.size > 0) {
      if (!state.mediaFilesBySize) state.mediaFilesBySize = new Map();
      state.mediaFilesBySize.set(file.size, file);
    }

    // 6. Index in list for date/fuzzy fallback
    if (!state.mediaFilesList) state.mediaFilesList = [];
    state.mediaFilesList.push(file);

    // 7. Auto unpack ZIP archive if dropped
    if (nameLower.endsWith('.zip') && window.JSZip) {
      unpackZipFile(file);
    }
  }

  /**
   * Multi-strategy local media file finder
   * Supports name, path, normalized variations, sequence code, byte size, date pattern
   */
  function findLocalMediaFile({ filename, filePath, fileSize, timestamp, type }) {
    if (!state.mediaFilesMap || state.mediaFilesMap.size === 0) return null;

    const candidates = [];
    function addCand(str) {
      if (!str) return;
      const s = String(str).trim();
      const sLower = s.toLowerCase();
      candidates.push(sLower);
      candidates.push(normalizeMediaKey(s));
      try {
        const decoded = decodeURIComponent(s).toLowerCase();
        if (decoded !== sLower) {
          candidates.push(decoded);
          candidates.push(normalizeMediaKey(decoded));
        }
      } catch (e) {}

      const base = s.split(/[\/\\]/).pop().toLowerCase();
      candidates.push(base);
      candidates.push(normalizeMediaKey(base));

      const dot = base.lastIndexOf('.');
      if (dot > 0) {
        candidates.push(base.slice(0, dot));
        candidates.push(normalizeMediaKey(base.slice(0, dot)));
      }
    }

    addCand(filename);
    addCand(filePath);

    // 1. Try filename candidates in Map
    for (const cand of candidates) {
      if (cand && state.mediaFilesMap.has(cand)) {
        const file = state.mediaFilesMap.get(cand);
        return { file, url: URL.createObjectURL(file) };
      }
    }

    // 2. Try matching by WhatsApp date + sequence code
    const targetMatch = (filename || filePath || '').match(/(?:IMG|VID|AUD|DOC|PTT|STK)?[-_]?(\d{8})[-_]?(WA\d+|\d+)/i);
    if (targetMatch) {
      const datePart = targetMatch[1];
      const seqPart = targetMatch[2].toLowerCase();
      const combo1 = `${datePart}_${seqPart}`;
      const combo2 = `${datePart}${seqPart}`;
      if (state.mediaFilesMap.has(combo1)) {
        const file = state.mediaFilesMap.get(combo1);
        return { file, url: URL.createObjectURL(file) };
      }
      if (state.mediaFilesMap.has(combo2)) {
        const file = state.mediaFilesMap.get(combo2);
        return { file, url: URL.createObjectURL(file) };
      }
      if (state.mediaFilesMap.has(seqPart)) {
        const file = state.mediaFilesMap.get(seqPart);
        return { file, url: URL.createObjectURL(file) };
      }
    }

    // 3. Try exact byte size match
    const sizeNum = Number(fileSize);
    if (sizeNum > 0 && state.mediaFilesBySize && state.mediaFilesBySize.has(sizeNum)) {
      const file = state.mediaFilesBySize.get(sizeNum);
      return { file, url: URL.createObjectURL(file) };
    }

    // 4. Try matching by WhatsApp date pattern in filename
    if (timestamp && type && state.mediaFilesList && state.mediaFilesList.length) {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) {
        const yyyymmdd = String(d.getFullYear()) +
          String(d.getMonth() + 1).padStart(2, '0') +
          String(d.getDate()).padStart(2, '0');
        
        for (const file of state.mediaFilesList) {
          const nameLower = file.name.toLowerCase();
          if (nameLower.includes(yyyymmdd)) {
            let matchesType = false;
            if (type === 'image' && nameLower.match(/\.(jpg|jpeg|png|webp|heic)$/)) matchesType = true;
            else if (type === 'video' && nameLower.match(/\.(mp4|3gp|mov|mkv)$/)) matchesType = true;
            else if (type === 'audio' && nameLower.match(/\.(opus|ogg|mp3|m4a)$/)) matchesType = true;
            else if (type === 'document' && nameLower.match(/\.(pdf|doc|docx|xls|xlsx|txt)$/)) matchesType = true;

            if (matchesType) {
              return { file, url: URL.createObjectURL(file) };
            }
          }
        }
      }
    }

    return null;
  }

  function applyMediaToMessage(msg) {
    if (!msg) return;
    if (msg.type === 'text') {
      const hint = ((msg.text || '') + ' ' + (msg.media ? (msg.media.filename || '') : '')).toLowerCase();
      if (hint.match(/\.(jpg|jpeg|png|webp|heic)|image\//)) msg.type = 'image';
      else if (hint.match(/\.(mp4|3gp|mov|mkv|avi)|video\//)) msg.type = 'video';
      else if (hint.match(/\.(opus|ogg|mp3|m4a|aac|wav)|audio\//)) msg.type = 'audio';
      else if (hint.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|apk)|application\//)) msg.type = 'document';
    }

    if (!msg.media) {
      if (['image', 'video', 'audio', 'document', 'sticker'].includes(msg.type)) {
        msg.media = { filename: msg.text || `${msg.type}_${msg.id}` };
      } else {
        return;
      }
    }

    const m = msg.media;
    const resolved = findLocalMediaFile({
      filename: m.filename,
      filePath: m.filePath,
      fileSize: m.fileSizeBytes,
      timestamp: msg.timestamp,
      type: msg.type
    });

    if (resolved) {
      m.file = resolved.file;
      m.url = resolved.url;
      m.hasFullMedia = true;
      if (resolved.file.name) {
        m.filename = resolved.file.name;
        m.ext = (resolved.file.name.split('.').pop() || m.ext || '').toUpperCase();
        if (resolved.file.size) {
          m.size = formatBytes(resolved.file.size);
        }
      }
    }
  }

  /**
   * Instantly replaces any missing media placeholder cards in the current chat DOM
   * without needing a full re-render
   */
  function refreshChatMediaDOM() {
    if (!dom.messagesViewport) return;
    const placeholders = dom.messagesViewport.querySelectorAll('.media-placeholder-card[data-filename]');
    if (!placeholders || !placeholders.length) return;

    let updatedCount = 0;
    placeholders.forEach(card => {
      const rawName = card.getAttribute('data-filename');
      const msgId = card.getAttribute('data-msg-id');
      const sizeBytes = card.getAttribute('data-filesize');
      const resolved = findLocalMediaFile({
        filename: rawName,
        fileSize: sizeBytes ? Number(sizeBytes) : undefined
      });

      if (resolved) {
        updatedCount++;
        const parent = card.parentElement;
        const isVideo = card.querySelector('.media-placeholder-icon.video');

        if (isVideo) {
          const videoWrap = document.createElement('div');
          videoWrap.className = 'media-container';
          videoWrap.style.cssText = 'position: relative;';
          videoWrap.innerHTML = `
            <video class="media-image-preview" src="${resolved.url}" controls preload="metadata" style="max-height: 280px; width: 100%; border-radius: 6px; background: #000000;"></video>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; display: flex; justify-content: space-between;">
              <span>${escapeHtml(resolved.file.name || rawName)}</span>
              <span>${formatBytes(resolved.file.size)}</span>
            </div>
          `;
          card.replaceWith(videoWrap);
        } else {
          const imgWrap = document.createElement('div');
          imgWrap.className = 'media-container';
          imgWrap.innerHTML = `
            <img class="media-image-preview" src="${resolved.url}" alt="${escapeHtml(rawName)}" data-caption="${escapeHtml(rawName)}" onclick="window.waOpenLightbox(this.src, this.getAttribute('data-caption'))" style="cursor: pointer; max-height: 320px; border-radius: 6px; animation: fadeIn 0.3s ease;">
          `;
          card.replaceWith(imgWrap);
        }
      }
    });

    if (updatedCount > 0) {
      console.log(`Live updated ${updatedCount} media placeholders in DOM.`);
    }
  }

  function updateMediaStatusUI() {
    if (!dom.mediaStatusBox) return;
    const total = state.mediaFilesMap.size;

    // 1. Compute missing media in active chat
    if (dom.mediaMissingChatSection && state.activeChatId) {
      const activeChat = state.chats.find(c => c.id === state.activeChatId);
      if (activeChat && activeChat.messages && activeChat.messages.length) {
        const missingItems = [];
        const seenMissing = new Set();
        for (const msg of activeChat.messages) {
          if (['image', 'video', 'document', 'audio'].includes(msg.type)) {
            const m = msg.media;
            const hasMedia = m && m.hasFullMedia && m.url;
            if (!hasMedia && m && m.filename && !seenMissing.has(m.filename)) {
              seenMissing.add(m.filename);
              missingItems.push({
                filename: m.filename,
                size: m.size || formatBytes(m.fileSizeBytes) || 'File',
                type: msg.type,
                id: msg.id
              });
            }
          }
        }

        if (missingItems.length > 0) {
          dom.mediaMissingChatSection.style.display = 'block';
          if (dom.mediaMissingCount) dom.mediaMissingCount.textContent = String(missingItems.length);
          if (dom.mediaMissingList) {
            dom.mediaMissingList.innerHTML = missingItems.slice(0, 15).map(item => `
              <div class="diagnostic-item">
                <span class="diagnostic-item-name" title="${escapeHtml(item.filename)}">
                  <svg style="width: 14px; height: 14px; fill: var(--wa-green-primary); flex-shrink: 0;" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <span>${escapeHtml(item.filename)} (${item.size})</span>
                </span>
                <button type="button" class="btn-locate-media" onclick="window.waLocateSpecificFile('${escapeHtml(item.filename)}', '${item.id}')">
                  📁 Cari File
                </button>
              </div>
            `).join('');
          }
        } else {
          dom.mediaMissingChatSection.style.display = 'none';
        }
      }
    }

    if (total === 0) {
      dom.mediaStatusBox.style.display = 'none';
      if (dom.btnLinkMedia) {
        dom.btnLinkMedia.classList.remove('linked');
        dom.btnLinkMedia.title = 'Link Local WhatsApp Media Folder (Optional to view original photos & documents)';
      }
      return;
    }

    dom.mediaStatusBox.style.display = 'block';

    // Breakdown by type
    let imgCount = 0, vidCount = 0, audCount = 0, docCount = 0, otherCount = 0;
    const seen = new Set();
    for (const [key, file] of state.mediaFilesMap.entries()) {
      if (seen.has(file)) continue;
      seen.add(file);
      const name = file.name.toLowerCase();
      if (name.match(/\.(jpg|jpeg|png|webp|gif|heic)$/)) imgCount++;
      else if (name.match(/\.(mp4|3gp|mov|mkv|avi)$/)) vidCount++;
      else if (name.match(/\.(opus|ogg|mp3|m4a|aac|wav)$/)) audCount++;
      else if (name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|apk)$/)) docCount++;
      else otherCount++;
    }

    if (dom.mediaStatusText) {
      dom.mediaStatusText.textContent = `${seen.size.toLocaleString()} files linked in memory`;
    }

    const parts = [];
    if (imgCount) parts.push(`${imgCount.toLocaleString()} photos`);
    if (vidCount) parts.push(`${vidCount.toLocaleString()} videos`);
    if (audCount) parts.push(`${audCount.toLocaleString()} audio`);
    if (docCount) parts.push(`${docCount.toLocaleString()} documents`);
    if (otherCount) parts.push(`${otherCount.toLocaleString()} other`);

    if (dom.mediaStatusBreakdown) {
      dom.mediaStatusBreakdown.textContent = parts.join(' • ') || 'Media indexed and ready in memory';
    }

    // Prominent Warning if 0 photos linked
    if (dom.mediaStatusWarning) {
      if (seen.size > 0 && imgCount === 0) {
        dom.mediaStatusWarning.style.display = 'block';
        dom.mediaStatusWarning.innerHTML = `
          <strong>Perhatian:</strong> Dari ${seen.size} file yang Anda pilih, <strong>belum ada file FOTO (.jpg/.png)</strong> yang terdeteksi. Foto WhatsApp disimpan terpisah di folder <code>WhatsApp Images</code>. Silakan pilih folder <strong>WhatsApp Images</strong> atau gunakan tombol <em>Pilih File Foto Langsung</em> di atas.
        `;
      } else {
        dom.mediaStatusWarning.style.display = 'none';
      }
    }

    if (dom.btnLinkMedia) {
      dom.btnLinkMedia.classList.add('linked');
      dom.btnLinkMedia.title = `WhatsApp Media Folder Linked (${seen.size.toLocaleString()} files available)`;
    }
  }

  function onMediaFilesLinked(newlyAdded) {
    updateMediaStatusUI();
    showToast(`Linked ${newlyAdded} files! (Total: ${state.mediaFilesMap.size} available in memory)`, 'success');

    // 1. Live DOM replacement for immediate visual feedback
    refreshChatMediaDOM();

    // 2. Refresh all chat messages in memory
    for (const chat of state.chats) {
      chat.messagesLoaded = false;
      if (chat.messages && chat.messages.length) {
        for (const msg of chat.messages) {
          applyMediaToMessage(msg);
        }
      }
    }

    // 3. Reload & re-render active chat
    if (state.activeChatId) {
      const chat = state.chats.find(c => c.id === state.activeChatId);
      if (chat) {
        chat.messagesLoaded = false;
        loadFullChatMessages(chat);
        renderMessages(chat);
      }
    }

    // 4. Re-render chat list so sidebar previews update
    renderChatList();
  }

  function clearLinkedMedia() {
    state.mediaFilesMap.clear();
    if (state.mediaFilesBySize) state.mediaFilesBySize.clear();
    state.mediaFilesList = [];
    updateMediaStatusUI();
    showToast('Linked media files cleared.', 'info');

    for (const chat of state.chats) {
      chat.messagesLoaded = false;
    }

    if (state.activeChatId) {
      const chat = state.chats.find(c => c.id === state.activeChatId);
      if (chat) {
        chat.messagesLoaded = false;
        loadFullChatMessages(chat);
        renderMessages(chat);
      }
    }
    renderChatList();
  }

  /**
   * Dedicated single-file or multi-file locator
   * Allows clicking "Cari File Ini" directly on the missing photo card
   */
  window.waLocateSpecificFile = function(targetFilename, msgId) {
    state.locatingTarget = { filename: targetFilename, msgId: msgId };
    if (dom.singleMediaPicker) {
      dom.singleMediaPicker.value = '';
      dom.singleMediaPicker.click();
    }
  };

  function handleSingleMediaPickerChange(e) {
    if (!e.target.files || !e.target.files.length) return;
    let added = 0;
    for (const file of e.target.files) {
      indexMediaFile(file, file.name);
      added++;
    }
    e.target.value = '';
    onMediaFilesLinked(added);
  }

  /**
   * ZIP File Auto-Extractor using JSZip (runs 100% in memory)
   */
  async function unpackZipFile(zipFile) {
    if (!window.JSZip) {
      showToast('JSZip library not available to unpack ZIP archive.', 'info');
      return;
    }

    try {
      showToast(`Membuka arsip ${zipFile.name}...`, 'info');
      const zip = await window.JSZip.loadAsync(zipFile);
      let count = 0;
      const entries = Object.keys(zip.files);
      
      for (const relPath of entries) {
        const entry = zip.files[relPath];
        if (entry.dir) continue;
        const name = relPath.split('/').pop();
        if (name.match(/\.(jpg|jpeg|png|webp|gif|mp4|3gp|opus|ogg|mp3|m4a|pdf|doc|docx|xls|xlsx|txt)$/i)) {
          const blob = await entry.async('blob');
          const file = new File([blob], name, { type: blob.type });
          indexMediaFile(file, relPath);
          count++;
        }
      }

      onMediaFilesLinked(count);
      showToast(`Berhasil mengekstrak ${count} file media dari arsip ZIP!`, 'success');
    } catch (err) {
      console.warn('Failed to unpack ZIP file:', err);
      showToast('Gagal membaca file ZIP: ' + err.message, 'error');
    }
  }

  function handleMediaZipPickerChange(e) {
    if (!e.target.files || !e.target.files.length) return;
    const file = e.target.files[0];
    e.target.value = '';
    unpackZipFile(file);
  }

  async function handleSelectFolderAction() {
    // 1. Modern File System Access API (window.showDirectoryPicker)
    if (typeof window.showDirectoryPicker === 'function') {
      try {
        const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
        let added = 0;
        showToast('Scanning media folder...', 'info');

        async function readDir(handle, currentPath = '') {
          try {
            for await (const entry of handle.values()) {
              try {
                if (entry.kind === 'file') {
                  const file = await entry.getFile();
                  indexMediaFile(file, currentPath + file.name);
                  added++;
                } else if (entry.kind === 'directory') {
                  // Skip system hidden folders like .trash, .git
                  if (!entry.name.startsWith('.')) {
                    await readDir(entry, currentPath + entry.name + '/');
                  }
                }
              } catch (entryErr) {
                console.warn('Skipped unreadable entry:', entry.name, entryErr);
              }
            }
          } catch (dirErr) {
            console.warn('Directory traversal warning:', dirErr);
          }
        }

        await readDir(dirHandle);
        onMediaFilesLinked(added);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User closed dialog
        if (err.name === 'SecurityError') {
          showToast('Browser blocks direct Downloads folder access. Please choose WhatsApp Images folder or click Select Files.', 'warning');
        } else {
          console.warn('showDirectoryPicker failed, falling back to input:', err);
        }
      }
    }

    // 2. Fallback to HTML webkitdirectory input
    if (dom.mediaFolderPicker) {
      dom.mediaFolderPicker.click();
    }
  }

  function handleMediaFolderPickerChange(e) {
    if (!e.target.files || !e.target.files.length) return;
    let added = 0;
    for (const file of e.target.files) {
      indexMediaFile(file, file.webkitRelativePath || file.name);
      added++;
    }
    e.target.value = '';
    onMediaFilesLinked(added);
  }

  function handleMediaFilesPickerChange(e) {
    if (!e.target.files || !e.target.files.length) return;
    let added = 0;
    for (const file of e.target.files) {
      indexMediaFile(file, file.name);
      added++;
    }
    e.target.value = '';
    onMediaFilesLinked(added);
  }

  async function handleMediaDrop(e) {
    const dataTransfer = e.dataTransfer;
    if (!dataTransfer) return;

    let added = 0;
    async function traverseEntry(entry, currentPath = '') {
      if (entry.isFile) {
        await new Promise((resolve) => {
          entry.file((file) => {
            indexMediaFile(file, currentPath + file.name);
            added++;
            resolve();
          }, () => resolve());
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        await new Promise((resolve) => {
          function readBatch() {
            dirReader.readEntries(async (entries) => {
              if (!entries || !entries.length) {
                resolve();
              } else {
                for (const child of entries) {
                  await traverseEntry(child, currentPath + entry.name + '/');
                }
                readBatch();
              }
            }, () => resolve());
          }
          readBatch();
        });
      }
    }

    const items = dataTransfer.items;
    if (items && items.length) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          await traverseEntry(entry);
        } else if (item.getAsFile) {
          const file = item.getAsFile();
          if (file) {
            indexMediaFile(file, file.name);
            added++;
          }
        }
      }
    } else if (dataTransfer.files && dataTransfer.files.length) {
      for (const file of dataTransfer.files) {
        indexMediaFile(file, file.name);
        added++;
      }
    }

    onMediaFilesLinked(added);
  }

  /* ==========================================================================
     STEP 1: HANDLING DB UPLOAD
     ========================================================================== */
  function handleDbFileSelected(file) {
    if (!file) return;

    state.dbFile = file;
    state.dbFileName = file.name;
    dom.loadedDbName.textContent = file.name;

    showToast(`Reading file ${file.name} (${formatBytes(file.size)})...`, 'info');

    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        state.dbBytes = new Uint8Array(e.target.result);
        const isPlain = WADecryptor.isPlainSqlite(state.dbBytes);

        if (isPlain) {
          // CASE 1: File is already an open SQLite database (no key required)
          showToast('Unencrypted SQLite database detected! Opening chat history...', 'success');
          await loadSqliteDatabase(state.dbBytes);
        } else {
          // CASE 2: File is encrypted (Crypt12/14/15) -> Open Step 2 Key Modal
          state.dbFileType = WADecryptor.detectFileType(file.name, state.dbBytes);
          openKeyModal(file.name, file.size, state.dbFileType);
        }
      } catch (err) {
        console.error('Error reading database file:', err);
        showToast('Failed to process database file: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  /* ==========================================================================
     STEP 2: KEY MODAL & DECRYPTION
     ========================================================================== */
  function openKeyModal(fileName, fileSize, fileType) {
    state.view = 'KEY_MODAL';
    dom.targetFileName.textContent = fileName;
    dom.targetFileSize.textContent = `${formatBytes(fileSize)} • Type: ${fileType.toUpperCase()}`;
    dom.keyFilePromptTitle.textContent = 'Select or Drag & Drop "key" File Here';
    dom.keyFilePromptSub.textContent = 'Standard file size: 158 bytes or 32 bytes';
    dom.hexKeyInput.value = '';
    state.keyInput = null;
    hideKeyAlert();
    dom.keyModal.style.display = 'flex';
  }

  function closeKeyModal() {
    dom.keyModal.style.display = 'none';
    state.view = 'UPLOAD';
    renderView();
  }

  function handleKeyFileSelected(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const bytes = new Uint8Array(e.target.result);
      state.keyInput = bytes;
      dom.keyFilePromptTitle.textContent = `Key File Selected: ${file.name}`;
      dom.keyFilePromptSub.textContent = `Size: ${bytes.length} bytes (Valid)`;
      dom.hexKeyInput.value = '';
      hideKeyAlert();
      showToast(`Key file ${file.name} ready for decryption!`, 'success');
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleDecryptSubmit() {
    const hexVal = dom.hexKeyInput.value.trim();
    let keyToUse = state.keyInput;

    if (hexVal) {
      keyToUse = hexVal;
    }

    if (!keyToUse) {
      showKeyAlert('Please upload a WhatsApp key file or enter a 64-digit hex key.');
      return;
    }

    // Set UI loading
    setDecryptLoading(true);
    hideKeyAlert();

    try {
      const decryptedBytes = await WADecryptor.decryptDatabase(
        state.dbBytes,
        keyToUse,
        state.dbFileType,
        (progress) => {
          dom.decryptBtnText.textContent = progress.message;
        }
      );

      showToast('Decryption successful! Reading WhatsApp SQLite structure...', 'success');
      dom.keyModal.style.display = 'none';
      await loadSqliteDatabase(decryptedBytes);
    } catch (err) {
      console.error('Decryption failed:', err);
      showKeyAlert(err.message || 'Decryption key does not match or database is corrupt.');
      showToast('Decryption failed. Please check your key.', 'error');
    } finally {
      setDecryptLoading(false);
    }
  }

  function setDecryptLoading(isLoading) {
    dom.btnDecryptSubmit.disabled = isLoading;
    if (isLoading) {
      dom.decryptBtnText.textContent = 'Decrypting...';
      dom.decryptSpinner.style.display = 'inline-block';
    } else {
      dom.decryptBtnText.textContent = 'Decrypt & Open Chat';
      dom.decryptSpinner.style.display = 'none';
    }
  }

  function showKeyAlert(msg) {
    dom.keyStatusAlert.style.display = 'flex';
    dom.keyStatusText.textContent = msg;
  }

  function hideKeyAlert() {
    dom.keyStatusAlert.style.display = 'none';
  }

  /* ==========================================================================
     SQLITE PARSING & DATABASE ENGINE
     ========================================================================== */
  function getTableColumns(db, tableName) {
    try {
      const res = db.exec(`PRAGMA table_info(${tableName});`);
      if (res.length && res[0].values) {
        return res[0].values.map(col => col[1]);
      }
    } catch (e) {}
    return [];
  }

  function inspectDatabaseSchema(db) {
    try {
      const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
      const tableNames = tablesRes.length ? tablesRes[0].values.map(row => row[0]) : [];

      const schemaInfo = {
        tableNames: tableNames,
        isNew: tableNames.includes('chat') && tableNames.includes('message'),
        isOld: tableNames.includes('messages'),
        hasMessageMedia: tableNames.includes('message_media'),
        hasMessageLocation: tableNames.includes('message_location'),
        hasMessageThumbnail: tableNames.includes('message_thumbnail'),
        messageMediaCols: [],
        messageLocationCols: [],
        messageThumbnailCols: [],
        messageCols: [],
        messagesCols: []
      };

      if (schemaInfo.hasMessageMedia) {
        schemaInfo.messageMediaCols = getTableColumns(db, 'message_media');
      }
      if (schemaInfo.hasMessageLocation) {
        schemaInfo.messageLocationCols = getTableColumns(db, 'message_location');
      }
      if (schemaInfo.hasMessageThumbnail) {
        schemaInfo.messageThumbnailCols = getTableColumns(db, 'message_thumbnail');
      }
      if (tableNames.includes('message')) {
        schemaInfo.messageCols = getTableColumns(db, 'message');
      }
      if (tableNames.includes('messages')) {
        schemaInfo.messagesCols = getTableColumns(db, 'messages');
      }

      console.log('Database Schema Analysis:', schemaInfo);
      return schemaInfo;
    } catch (e) {
      console.warn('Failed to inspect database schema:', e);
      return null;
    }
  }

  function blobToDataUrl(bytes, mimeType = 'image/jpeg') {
    if (!bytes || !bytes.length) return null;
    try {
      const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      let binary = '';
      const chunk = 8192;
      for (let i = 0; i < arr.length; i += chunk) {
        binary += String.fromCharCode.apply(null, arr.subarray(i, i + chunk));
      }
      return `data:${mimeType};base64,${btoa(binary)}`;
    } catch (e) {
      return null;
    }
  }

  async function loadSqliteDatabase(sqliteBytes) {
    try {
      // 1. Initialize SQL.js if not yet initialized
      if (!state.sqlEngine) {
        if (typeof window.initSqlJs === 'function') {
          state.sqlEngine = await window.initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
          });
        }
      }

      if (state.sqlEngine) {
        const db = new state.sqlEngine.Database(sqliteBytes);
        state.sqliteDb = db; // Retain SQLite instance for unlimited on-demand message queries
        state.schemaInfo = inspectDatabaseSchema(db); // Detect schema tables and columns dynamically
        const parsedChats = parseWhatsAppSqlite(db);
        if (parsedChats && parsedChats.length > 0) {
          state.chats = parsedChats;
          state.view = 'CHAT_VIEW';
          showToast(`Successfully loaded all ${parsedChats.length} WhatsApp conversations!`, 'success');
          renderView();
          return;
        } else {
          showToast('Database opened, but no valid WhatsApp messages were found. Displaying demo mode.', 'info');
        }
      } else {
        showToast('SQL.js WebAssembly module could not be loaded offline, falling back to demo preview.', 'info');
      }
    } catch (err) {
      console.warn('Failed to parse WhatsApp SQLite database:', err);
      showToast('Failed to read SQLite tables: ' + err.message, 'error');
    }

    // Fallback to demo dataset if database empty or failed
    loadDemoDatabase();
  }

  /**
   * Retrieves ALL messages for a single conversation on-demand without LIMIT restrictions
   * Parses text, attachments, photos, documents, locations, voice notes, and audio
   */
  function loadFullChatMessages(chat) {
    if (!chat || chat.messagesLoaded) return chat ? chat.messages : [];

    if (state.sqliteDb) {
      try {
        const s = state.schemaInfo;
        if (state.dbSchema === 'new' && chat.rawChatId !== undefined) {
          let joins = '';
          let selectExtra = '';

          // 1. Join message_media
          if (s && s.hasMessageMedia) {
            joins += ' LEFT JOIN message_media mm ON m._id = mm.message_row_id';
            const c = s.messageMediaCols;
            selectExtra += `,
              ${c.includes('file_path') ? 'mm.file_path' : 'NULL'} AS mm_file_path,
              ${c.includes('file_size') ? 'mm.file_size' : 'NULL'} AS mm_file_size,
              ${c.includes('mime_type') ? 'mm.mime_type' : 'NULL'} AS mm_mime_type,
              ${c.includes('media_name') ? 'mm.media_name' : (c.includes('media_caption') ? 'mm.media_caption' : 'NULL')} AS mm_media_name,
              ${c.includes('media_duration') ? 'mm.media_duration' : 'NULL'} AS mm_media_duration,
              ${c.includes('page_count') ? 'mm.page_count' : 'NULL'} AS mm_page_count
            `;
          } else {
            selectExtra += `,
              NULL AS mm_file_path,
              NULL AS mm_file_size,
              NULL AS mm_mime_type,
              NULL AS mm_media_name,
              NULL AS mm_media_duration,
              NULL AS mm_page_count
            `;
          }

          // 2. Join message_location
          if (s && s.hasMessageLocation) {
            joins += ' LEFT JOIN message_location ml ON m._id = ml.message_row_id';
            const c = s.messageLocationCols;
            selectExtra += `,
              ${c.includes('latitude') ? 'ml.latitude' : 'NULL'} AS ml_lat,
              ${c.includes('longitude') ? 'ml.longitude' : 'NULL'} AS ml_lng,
              ${c.includes('place_name') ? 'ml.place_name' : 'NULL'} AS ml_name,
              ${c.includes('place_address') ? 'ml.place_address' : 'NULL'} AS ml_address
            `;
          } else {
            selectExtra += `,
              NULL AS ml_lat,
              NULL AS ml_lng,
              NULL AS ml_name,
              NULL AS ml_address
            `;
          }

          // 3. Join message_thumbnail
          if (s && s.hasMessageThumbnail && s.messageThumbnailCols.includes('thumbnail')) {
            joins += ' LEFT JOIN message_thumbnail mt ON m._id = mt.message_row_id';
            selectExtra += `, mt.thumbnail AS mt_thumbnail`;
          } else {
            selectExtra += `, NULL AS mt_thumbnail`;
          }

          const msgQuery = `
            SELECT 
              m._id AS id,
              m.from_me,
              m.timestamp,
              COALESCE(m.text_data, '') AS text,
              m.message_type,
              m.status,
              COALESCE(sj.raw_string, '') AS sender_jid
              ${selectExtra}
            FROM message m
            LEFT JOIN jid sj ON m.sender_jid_row_id = sj._id
            ${joins}
            WHERE m.chat_row_id = ${chat.rawChatId}
            ORDER BY m.timestamp ASC;
          `;
          const resMsgs = state.sqliteDb.exec(msgQuery);
          const messages = [];
          if (resMsgs.length && resMsgs[0].values.length) {
            for (const mRow of resMsgs[0].values) {
              const [
                mId, fromMe, ts, text, msgType, status, senderJid,
                filePath, fileSize, mimeType, mediaName, mediaDuration, pageCount,
                mlLat, mlLng, mlName, mlAddress, mtThumbnail
              ] = mRow;

              const mTypeNum = Number(msgType !== null && msgType !== undefined ? msgType : -1);
              let type = 'text';
              if (mTypeNum === 1 || mTypeNum === 13 || mTypeNum === 42 || mTypeNum === 81) type = 'image';
              else if (mTypeNum === 2) type = 'audio';
              else if (mTypeNum === 3 || mTypeNum === 43 || mTypeNum === 82) type = 'video';
              else if (mTypeNum === 4) type = 'contact';
              else if (mTypeNum === 5 || mTypeNum === 14) type = 'location';
              else if (mTypeNum === 9) type = 'document';
              else if (mTypeNum === 15 || mTypeNum === 20) type = 'sticker';

              // Fallback detection from mimeType or filePath or mediaName if type is still 'text'
              const hint = ((mimeType || '') + ' ' + (filePath || '') + ' ' + (mediaName || '')).toLowerCase();
              if (type === 'text') {
                if (hint.match(/\.(jpg|jpeg|png|webp|heic)|image\//)) type = 'image';
                else if (hint.match(/\.(mp4|3gp|mov|mkv|avi)|video\//)) type = 'video';
                else if (hint.match(/\.(opus|ogg|mp3|m4a|aac|wav)|audio\//)) type = 'audio';
                else if (hint.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|apk)|application\//)) type = 'document';
              }

              let rawFilename = mediaName || (filePath ? filePath.split(/[\/\\]/).pop() : '');
              if (!rawFilename) {
                if (type === 'document') rawFilename = `Document_${mId}.pdf`;
                else if (type === 'image') rawFilename = `IMG_${mId}.jpg`;
                else if (type === 'video') rawFilename = `VID_${mId}.mp4`;
                else if (type === 'audio') rawFilename = `AUD_${mId}.opus`;
              }
              const ext = (rawFilename.split('.').pop() || 'FILE').toUpperCase();

              // Multi-strategy media resolution (name, path, byte size, date pattern)
              const resolved = findLocalMediaFile({
                filename: rawFilename,
                filePath: filePath,
                fileSize: fileSize,
                timestamp: ts,
                type: type
              });
              const localFile = resolved ? resolved.file : null;
              const localUrl = resolved ? resolved.url : null;
              const thumbUrl = mtThumbnail ? blobToDataUrl(mtThumbnail, 'image/jpeg') : null;

              let media = null;
              let location = null;

              if (type === 'document') {
                media = {
                  filename: localFile ? localFile.name : rawFilename,
                  filePath: filePath,
                  fileSizeBytes: fileSize,
                  ext: (localFile ? localFile.name.split('.').pop() : ext).toUpperCase(),
                  size: fileSize ? formatBytes(fileSize) : (localFile ? formatBytes(localFile.size) : ''),
                  url: localUrl,
                  pageCount: pageCount || null,
                  hasFullMedia: !!localUrl
                };
              } else if (type === 'image') {
                media = {
                  filename: localFile ? localFile.name : rawFilename,
                  filePath: filePath,
                  fileSizeBytes: fileSize,
                  url: localUrl || thumbUrl,
                  caption: text,
                  size: fileSize ? formatBytes(fileSize) : (localFile ? formatBytes(localFile.size) : ''),
                  hasFullMedia: !!localUrl
                };
              } else if (type === 'video') {
                media = {
                  filename: localFile ? localFile.name : rawFilename,
                  filePath: filePath,
                  fileSizeBytes: fileSize,
                  url: localUrl || thumbUrl,
                  caption: text,
                  duration: mediaDuration || 0,
                  size: fileSize ? formatBytes(fileSize) : (localFile ? formatBytes(localFile.size) : ''),
                  hasFullMedia: !!localUrl
                };
              } else if (type === 'audio') {
                media = {
                  filename: localFile ? localFile.name : rawFilename,
                  filePath: filePath,
                  fileSizeBytes: fileSize,
                  duration: mediaDuration || 30,
                  url: localUrl,
                  hasFullMedia: !!localUrl
                };
              } else if (type === 'location') {
                location = {
                  name: mlName || 'Shared Location',
                  address: mlAddress || (mlLat && mlLng ? `${mlLat}, ${mlLng}` : 'Location Pin'),
                  latitude: mlLat,
                  longitude: mlLng
                };
              } else if (type === 'sticker') {
                media = {
                  filename: localFile ? localFile.name : rawFilename,
                  filePath: filePath,
                  url: localUrl || thumbUrl,
                  alt: 'Sticker',
                  hasFullMedia: !!localUrl
                };
              }

              messages.push({
                id: 'msg_' + mId,
                fromMe: fromMe === 1,
                timestamp: ts,
                text: text || '',
                type: type,
                status: status || 2,
                senderJid: senderJid,
                senderName: senderJid ? formatJidToName(senderJid) : null,
                senderColor: getRandomColor(senderJid || 'user'),
                media: media,
                audioDuration: mediaDuration || 30,
                location: location
              });
            }
          }
          chat.messages = messages;
        } else if (state.dbSchema === 'old' && chat.jid) {
          const cleanJid = chat.jid.replace(/'/g, "''");
          const c = state.schemaInfo ? state.schemaInfo.messagesCols : [];
          const hasMediaName = c.includes('media_name');
          const hasMediaCap = c.includes('media_caption');
          const hasMediaSize = c.includes('media_size');
          const hasMediaDur = c.includes('media_duration');
          const hasLat = c.includes('latitude');
          const hasLng = c.includes('longitude');
          const hasThumb = c.includes('thumb_image');

          const msgQuery = `
            SELECT 
              _id,
              key_from_me,
              timestamp,
              COALESCE(data, '') AS text,
              media_wa_type,
              remote_resource,
              status,
              ${hasMediaName ? 'media_name' : 'NULL'} AS media_name,
              ${hasMediaCap ? 'media_caption' : 'NULL'} AS media_caption,
              ${hasMediaSize ? 'media_size' : 'NULL'} AS media_size,
              ${hasMediaDur ? 'media_duration' : 'NULL'} AS media_duration,
              ${hasLat ? 'latitude' : 'NULL'} AS latitude,
              ${hasLng ? 'longitude' : 'NULL'} AS longitude,
              ${hasThumb ? 'thumb_image' : 'NULL'} AS thumb_image
            FROM messages
            WHERE key_remote_jid = '${cleanJid}'
            ORDER BY timestamp ASC;
          `;
          const resMsgs = state.sqliteDb.exec(msgQuery);
          const messages = [];
          if (resMsgs.length && resMsgs[0].values.length) {
            for (const mRow of resMsgs[0].values) {
              const [
                mId, fromMe, ts, text, waType, remoteRes, status,
                mediaName, mediaCap, mediaSize, mediaDur,
                lat, lng, thumbImg
              ] = mRow;

              const waTypeStr = String(waType || '0');
              let type = 'text';
              if (waTypeStr === '1' || waTypeStr === '13' || waTypeStr === '42') type = 'image';
              else if (waTypeStr === '2') type = 'audio';
              else if (waTypeStr === '3' || waTypeStr === '43') type = 'video';
              else if (waTypeStr === '4') type = 'contact';
              else if (waTypeStr === '5' || waTypeStr === '14') type = 'location';
              else if (waTypeStr === '9') type = 'document';
              else if (waTypeStr === '15' || waTypeStr === '20') type = 'sticker';

              const hint = ((mediaName || '') + ' ' + (mediaCap || '')).toLowerCase();
              if (type === 'text') {
                if (hint.match(/\.(jpg|jpeg|png|webp|heic)|image\//)) type = 'image';
                else if (hint.match(/\.(mp4|3gp|mov|mkv|avi)|video\//)) type = 'video';
                else if (hint.match(/\.(opus|ogg|mp3|m4a|aac|wav)|audio\//)) type = 'audio';
                else if (hint.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|apk)|application\//)) type = 'document';
              }

              let rawFilename = mediaName || '';
              if (!rawFilename) {
                if (type === 'document') rawFilename = `Document_${mId}.pdf`;
                else if (type === 'image') rawFilename = `IMG_${mId}.jpg`;
                else if (type === 'video') rawFilename = `VID_${mId}.mp4`;
                else if (type === 'audio') rawFilename = `AUD_${mId}.opus`;
              }
              const ext = (rawFilename.split('.').pop() || 'FILE').toUpperCase();

              const resolved = findLocalMediaFile({
                filename: rawFilename,
                filePath: mediaName,
                fileSize: mediaSize,
                timestamp: ts,
                type: type
              });
              const localFile = resolved ? resolved.file : null;
              const localUrl = resolved ? resolved.url : null;
              const thumbUrl = thumbImg ? blobToDataUrl(thumbImg, 'image/jpeg') : null;

              let media = null;
              let location = null;

              if (type === 'document') {
                media = {
                  filename: localFile ? localFile.name : rawFilename,
                  filePath: mediaName,
                  fileSizeBytes: mediaSize,
                  ext: (localFile ? localFile.name.split('.').pop() : ext).toUpperCase(),
                  size: mediaSize ? formatBytes(mediaSize) : (localFile ? formatBytes(localFile.size) : ''),
                  url: localUrl,
                  hasFullMedia: !!localUrl
                };
              } else if (type === 'image') {
                media = {
                  filename: localFile ? localFile.name : rawFilename,
                  filePath: mediaName,
                  fileSizeBytes: mediaSize,
                  url: localUrl || thumbUrl,
                  caption: mediaCap || text,
                  size: mediaSize ? formatBytes(mediaSize) : (localFile ? formatBytes(localFile.size) : ''),
                  hasFullMedia: !!localUrl
                };
              } else if (type === 'video') {
                media = {
                  filename: localFile ? localFile.name : rawFilename,
                  filePath: mediaName,
                  fileSizeBytes: mediaSize,
                  url: localUrl || thumbUrl,
                  caption: mediaCap || text,
                  duration: mediaDur || 0,
                  size: mediaSize ? formatBytes(mediaSize) : (localFile ? formatBytes(localFile.size) : ''),
                  hasFullMedia: !!localUrl
                };
              } else if (type === 'audio') {
                media = {
                  filename: localFile ? localFile.name : rawFilename,
                  filePath: mediaName,
                  fileSizeBytes: mediaSize,
                  duration: mediaDur || 30,
                  url: localUrl,
                  hasFullMedia: !!localUrl
                };
              } else if (type === 'location') {
                location = {
                  name: 'Shared Location',
                  address: lat && lng ? `${lat}, ${lng}` : 'Location Pin',
                  latitude: lat,
                  longitude: lng
                };
              } else if (type === 'sticker') {
                media = {
                  filename: localFile ? localFile.name : rawFilename,
                  filePath: mediaName,
                  url: localUrl || thumbUrl,
                  alt: 'Sticker',
                  hasFullMedia: !!localUrl
                };
              }

              messages.push({
                id: 'msg_' + mId,
                fromMe: fromMe === 1,
                timestamp: ts,
                text: text || mediaCap || '',
                type: type,
                status: status || 2,
                senderJid: remoteRes,
                senderName: remoteRes ? formatJidToName(remoteRes) : null,
                senderColor: getRandomColor(remoteRes || 'contact'),
                media: media,
                audioDuration: mediaDur || 30,
                location: location
              });
            }
          }
          chat.messages = messages;
        }
      } catch (err) {
        console.error('Failed to load full messages for chat:', err);
      }
    } else {
      // In-memory / Demo Mode fallback: match any messages with linked media
      if (chat.messages && chat.messages.length) {
        for (const msg of chat.messages) {
          applyMediaToMessage(msg);
        }
      }
    }
    chat.messagesLoaded = true;
    return chat.messages;
  }

  /**
   * Parse WhatsApp SQLite tables (supporting modern and legacy schemas)
   * Without LIMIT so all chats and full histories are loaded
   */
  function parseWhatsAppSqlite(db) {
    const chats = [];
    try {
      // Check existing tables
      const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
      const tableNames = tablesRes.length ? tablesRes[0].values.map(row => row[0]) : [];

      console.log('Detected tables in WhatsApp SQLite:', tableNames);

      const hasNewSchema = tableNames.includes('chat') && tableNames.includes('message');
      const hasOldSchema = tableNames.includes('messages');

      if (hasNewSchema) {
        state.dbSchema = 'new';
        // Modern WhatsApp Schema Query - NO LIMIT so all contacts and groups are loaded
        const chatQuery = `
          SELECT 
            c._id AS chat_id,
            COALESCE(c.subject, j.raw_string, j.user, 'WhatsApp Contact') AS chat_name,
            COALESCE(j.raw_string, '') AS jid,
            COALESCE(c.sort_timestamp, 0) AS last_timestamp,
            COALESCE(c.unseen_message_count, 0) AS unread_count
          FROM chat c
          LEFT JOIN jid j ON c.jid_row_id = j._id
          WHERE (j.raw_string IS NULL OR j.raw_string != 'status@broadcast')
          ORDER BY c.sort_timestamp DESC;
        `;
        const resChats = db.exec(chatQuery);
        if (resChats.length && resChats[0].values.length) {
          const chatRows = resChats[0].values;
          for (const row of chatRows) {
            const [chatId, name, jid, sortTs, unread] = row;
            const isGroup = (jid || '').endsWith('@g.us');

            // Fetch last message for sidebar preview (1 message only for fast initial loading)
            const lastMsgQuery = `
              SELECT 
                _id, from_me, timestamp, COALESCE(text_data, '') AS text, message_type, status
              FROM message
              WHERE chat_row_id = ${chatId}
              ORDER BY timestamp DESC
              LIMIT 1;
            `;
            const resLast = db.exec(lastMsgQuery);
            const messages = [];
            if (resLast.length && resLast[0].values.length) {
              const [lmId, fromMe, ts, text, msgType, status] = resLast[0].values[0];
              let pType = 'text';
              if (msgType === 1 || msgType === 13) pType = 'image';
              else if (msgType === 2) pType = 'audio';
              else if (msgType === 3) pType = 'video';
              else if (msgType === 4) pType = 'contact';
              else if (msgType === 5) pType = 'location';
              else if (msgType === 9) pType = 'document';
              else if (msgType === 15 || msgType === 20) pType = 'sticker';

              messages.push({
                id: 'msg_' + lmId,
                fromMe: fromMe === 1,
                timestamp: ts,
                text: text || '',
                type: pType,
                status: status || 2
              });
            }

            chats.push({
              id: 'chat_' + chatId,
              rawChatId: chatId,
              jid: jid,
              name: name || formatJidToName(jid),
              isGroup: isGroup,
              pinned: false,
              unreadCount: unread || 0,
              onlineStatus: isGroup ? 'WhatsApp Group' : 'online',
              about: 'WhatsApp Status',
              messages: messages,
              messagesLoaded: false // Full messages without limit will be loaded when clicked
            });
          }
        }
      } else if (hasOldSchema) {
        state.dbSchema = 'old';
        // Legacy Schema Query (messages table) - NO LIMIT
        const chatQuery = `
          SELECT 
            key_remote_jid AS jid,
            MAX(timestamp) AS last_ts,
            COUNT(*) AS total_msgs
          FROM messages
          WHERE key_remote_jid IS NOT NULL AND key_remote_jid != '-1' AND key_remote_jid != 'status@broadcast'
          GROUP BY key_remote_jid
          ORDER BY last_ts DESC;
        `;
        const resChats = db.exec(chatQuery);
        if (resChats.length && resChats[0].values.length) {
          for (const row of resChats[0].values) {
            const [jid, lastTs, total] = row;
            const isGroup = (jid || '').endsWith('@g.us');
            const cleanJid = jid.replace(/'/g, "''");

            // Fetch last message for preview
            const lastMsgQuery = `
              SELECT 
                _id, key_from_me, timestamp, COALESCE(data, media_caption, '') AS text, media_wa_type, status
              FROM messages
              WHERE key_remote_jid = '${cleanJid}'
              ORDER BY timestamp DESC
              LIMIT 1;
            `;
            const resLast = db.exec(lastMsgQuery);
            const messages = [];
            if (resLast.length && resLast[0].values.length) {
              const [lmId, fromMe, ts, text, waType, status] = resLast[0].values[0];
              const waTypeStr = String(waType || '0');
              let pType = 'text';
              if (waTypeStr === '1') pType = 'image';
              else if (waTypeStr === '2') pType = 'audio';
              else if (waTypeStr === '3') pType = 'video';
              else if (waTypeStr === '4') pType = 'contact';
              else if (waTypeStr === '5') pType = 'location';
              else if (waTypeStr === '9') pType = 'document';
              else if (waTypeStr === '15' || waTypeStr === '20') pType = 'sticker';

              messages.push({
                id: 'msg_' + lmId,
                fromMe: fromMe === 1,
                timestamp: ts,
                text: text || '',
                type: pType,
                status: status || 2
              });
            }

            chats.push({
              id: 'chat_' + jid,
              jid: jid,
              name: formatJidToName(jid),
              isGroup: isGroup,
              pinned: false,
              unreadCount: 0,
              onlineStatus: isGroup ? 'WhatsApp Group' : 'online',
              about: 'WhatsApp Contact',
              messages: messages,
              messagesLoaded: false
            });
          }
        }
      }
    } catch (e) {
      console.error('Error during SQLite query:', e);
    }
    return chats;
  }

  /* ==========================================================================
     DEMO DATABASE LOADER
     ========================================================================= */
  function loadDemoDatabase() {
    state.chats = window.DEMO_CHATS || [];
    state.dbFileName = 'msgstore_demo.db';
    dom.loadedDbName.textContent = 'msgstore_demo.db (Demo)';
    state.view = 'CHAT_VIEW';
    showToast('WhatsApp Demo Database loaded successfully! Explore the chats.', 'success');
    renderView();
  }

  function resetToUpload() {
    state.view = 'UPLOAD';
    state.chats = [];
    state.activeChatId = null;
    state.dbFile = null;
    state.dbBytes = null;
    state.keyInput = null;
    if (state.audioInterval) clearInterval(state.audioInterval);
    renderView();
  }

  /* ==========================================================================
     STEP 3: WHATSAPP WEB UI RENDERING
     ========================================================================== */
  function renderChatList() {
    dom.chatList.innerHTML = '';

    // Filter search & categories
    const filtered = state.chats.filter(chat => {
      // Category filter
      if (state.activeFilter === 'unread' && (!chat.unreadCount || chat.unreadCount <= 0)) return false;
      if (state.activeFilter === 'groups' && !chat.isGroup) return false;
      if (state.activeFilter === 'personal' && chat.isGroup) return false;

      // Text query
      if (state.searchQuery) {
        const matchName = (chat.name || '').toLowerCase().includes(state.searchQuery);
        const matchPhone = (chat.phone || '').toLowerCase().includes(state.searchQuery);
        const matchMsg = chat.messages.some(m => (m.text || '').toLowerCase().includes(state.searchQuery));
        return matchName || matchPhone || matchMsg;
      }
      return true;
    });

    if (filtered.length === 0) {
      dom.chatList.innerHTML = `
        <li style="padding: 30px 20px; text-align: center; color: var(--text-secondary); font-size: 13px;">
          No conversations match your search.
        </li>
      `;
      return;
    }

    filtered.forEach(chat => {
      const lastMsg = chat.messages[chat.messages.length - 1] || null;
      const li = document.createElement('li');
      li.className = `chat-item ${chat.id === state.activeChatId ? 'active' : ''}`;
      li.setAttribute('data-id', chat.id);

      const avatarBg = chat.avatarColor || getRandomColor(chat.name);
      const initials = getInitials(chat.name);
      const timeStr = lastMsg ? formatWhatsAppTime(lastMsg.timestamp) : '';
      const previewText = getMessagePreviewText(lastMsg);

      li.innerHTML = `
        <div class="chat-item-avatar">
          <div class="avatar" style="background-color: ${avatarBg};">
            ${chat.isGroup ? `<svg style="width: 22px; height: 22px; fill: #ffffff;" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>` : initials}
          </div>
        </div>
        <div class="chat-item-content">
          <div class="chat-item-top">
            <span class="chat-item-title">
              ${escapeHtml(chat.name)}
              ${chat.isVerified ? `<svg class="verified-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>` : ''}
            </span>
            <span class="chat-item-time ${chat.unreadCount > 0 ? 'unread' : ''}">${timeStr}</span>
          </div>
          <div class="chat-item-bottom">
            <div class="chat-item-preview">
              ${lastMsg && lastMsg.fromMe ? renderTickSvg(lastMsg.status) : ''}
              <span>${previewText}</span>
            </div>
            <div class="chat-item-badges">
              ${chat.pinned ? `<span class="badge-pin"><svg viewBox="0 0 24 24"><path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z"/></svg></span>` : ''}
              ${chat.unreadCount > 0 ? `<span class="badge-unread">${chat.unreadCount}</span>` : ''}
            </div>
          </div>
        </div>
      `;

      li.addEventListener('click', () => selectChat(chat.id));
      dom.chatList.appendChild(li);
    });
  }

  function selectChat(chatId) {
    state.activeChatId = chatId;
    const chat = state.chats.find(c => c.id === chatId);
    if (!chat) return;

    // Ensure all messages for this chat are loaded without limit
    loadFullChatMessages(chat);

    // Reset unread count
    chat.unreadCount = 0;

    // Active state in sidebar
    document.querySelectorAll('.chat-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-id') === chatId);
    });

    // Display chat canvas
    dom.emptyChatState.style.display = 'none';
    dom.activeChatContainer.style.display = 'flex';
    dom.viewWhatsApp.classList.add('chat-active');

    // Header Chat
    const avatarBg = chat.avatarColor || getRandomColor(chat.name);
    dom.activeChatAvatar.style.backgroundColor = avatarBg;
    dom.activeChatAvatar.innerHTML = chat.isGroup 
      ? `<svg style="width: 22px; height: 22px; fill: #ffffff;" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`
      : getInitials(chat.name);

    dom.activeChatTitle.textContent = chat.name;
    dom.activeChatSub.textContent = chat.onlineStatus || (chat.isGroup ? 'WhatsApp Group' : 'online');
    dom.activeMsgCount.textContent = `${chat.messages.length.toLocaleString('en-US')} ${chat.messages.length === 1 ? 'Message' : 'Messages'}`;

    // Render messages
    renderMessages(chat);

    // Scroll to bottom
    setTimeout(() => {
      dom.messagesViewport.scrollTop = dom.messagesViewport.scrollHeight;
    }, 50);

    // Update Drawer if open
    updateInfoDrawer(chat);
  }

  function renderMessages(chat) {
    dom.messagesViewport.innerHTML = '';
    const fragment = document.createDocumentFragment();

    // WhatsApp encryption security pill
    const encPill = document.createElement('div');
    encPill.className = 'security-notice-pill';
    encPill.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
      <span>Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.</span>
    `;
    fragment.appendChild(encPill);

    let lastDateStr = null;

    chat.messages.forEach(msg => {
      // Date Separator
      const msgDateStr = formatDateSeparator(msg.timestamp);
      if (msgDateStr !== lastDateStr) {
        lastDateStr = msgDateStr;
        const dateSep = document.createElement('div');
        dateSep.className = 'date-separator';
        dateSep.textContent = msgDateStr;
        fragment.appendChild(dateSep);
      }

      const row = document.createElement('div');
      row.className = `message-row ${msg.fromMe ? 'outgoing' : 'incoming'}`;
      row.id = msg.id;

      let innerHtml = '<div class="message-bubble">';

      // Sender Name (in group chat)
      if (chat.isGroup && !msg.fromMe && msg.senderName) {
        innerHtml += `<span class="sender-name-tag" style="color: ${msg.senderColor || '#1f7aec'};">${escapeHtml(msg.senderName)}</span>`;
      }

      // Quoted Reply
      if (msg.replyTo) {
        innerHtml += `
          <div class="quoted-reply">
            <div class="quoted-sender">${escapeHtml(msg.replyTo.senderName || 'Reply')}</div>
            <div class="quoted-text">${escapeHtml(msg.replyTo.text || '')}</div>
          </div>
        `;
      }

      // Message Content based on type
      if (msg.type === 'document') {
        const m = msg.media || {};
        const ext = (m.ext || 'DOC').toUpperCase();
        const extClass = `doc-ext-${ext.toLowerCase()}`;
        const subParts = [];
        if (m.size) subParts.push(m.size);
        subParts.push(ext);
        if (m.pageCount) subParts.push(`${m.pageCount} pages`);
        const subText = subParts.join(' • ');

        innerHtml += `
          <div class="doc-card" data-filename="${escapeHtml(m.filename || '')}" data-msg-id="${msg.id}" data-filesize="${m.fileSizeBytes || ''}" ${m.url ? `onclick="window.open('${m.url}', '_blank')"` : `onclick="window.waOpenMediaModal ? window.waOpenMediaModal() : null"`} title="${m.url ? 'Click to open document' : 'Click to link your WhatsApp Media folder to open this document'}" style="cursor: pointer;">
            <div class="doc-icon ${extClass}">${escapeHtml(ext.slice(0, 4))}</div>
            <div class="doc-details">
              <div class="doc-name">${escapeHtml(m.filename || 'Document')}</div>
              <div class="doc-sub">${escapeHtml(subText)}</div>
              ${!m.url ? `<button type="button" class="btn-locate-media" onclick="event.stopPropagation(); window.waLocateSpecificFile('${escapeHtml(m.filename || '')}', '${msg.id}')">📁 Pilih File Ini</button>` : ''}
            </div>
            ${m.url ? `<div class="doc-action-btn" title="Open"><svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: currentColor;"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg></div>` : `<div class="doc-action-btn" title="Link Media Folder"><svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: currentColor;"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg></div>`}
          </div>
        `;
        if (msg.text && msg.text !== m.filename) {
          innerHtml += `<div class="message-text">${formatMessageText(msg.text)}</div>`;
        }
      } else if (msg.type === 'image') {
        const m = msg.media || {};
        if (m.url) {
          innerHtml += `
            <div class="media-container">
              <img class="media-image-preview" src="${m.url}" alt="${escapeHtml(m.caption || 'Photo')}" data-caption="${escapeHtml(m.caption || m.filename || '')}" onclick="window.waOpenLightbox(this.src, this.getAttribute('data-caption'))">
            </div>
          `;
        } else {
          innerHtml += `
            <div class="media-placeholder-card" data-filename="${escapeHtml(m.filename || '')}" data-msg-id="${msg.id}" data-filesize="${m.fileSizeBytes || ''}" onclick="window.waOpenMediaModal ? window.waOpenMediaModal() : null" style="cursor: pointer;" title="Click to link WhatsApp/Media folder and view this photo">
              <div class="media-placeholder-icon">
                <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              </div>
              <div class="media-placeholder-info">
                <div class="media-placeholder-title">${escapeHtml(m.filename || 'Photo Attachment')}</div>
                <div class="media-placeholder-meta">${m.size || 'Image'} • Click to link Media folder</div>
                <button type="button" class="btn-locate-media" onclick="event.stopPropagation(); window.waLocateSpecificFile('${escapeHtml(m.filename || '')}', '${msg.id}')">
                  📁 Pilih File Ini
                </button>
              </div>
            </div>
          `;
        }
        if (msg.text) {
          innerHtml += `<div class="message-text">${formatMessageText(msg.text)}</div>`;
        }
      } else if (msg.type === 'video') {
        const m = msg.media || {};
        if (m.url) {
          if (m.hasFullMedia) {
            innerHtml += `
              <div class="media-container" style="position: relative;">
                <video class="media-image-preview" src="${m.url}" controls preload="metadata" style="max-height: 280px; width: 100%; border-radius: 6px; background: #000000;"></video>
                <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; display: flex; justify-content: space-between;">
                  <span>${escapeHtml(m.filename || 'Video')}</span>
                  <span>${m.size ? m.size : ''}</span>
                </div>
              </div>
            `;
          } else {
            innerHtml += `
              <div class="media-container" style="position: relative; cursor: pointer;" onclick="window.waOpenLightbox('${m.url}', '${escapeHtml(m.caption || 'Video')}')">
                <img class="media-image-preview" src="${m.url}" alt="${escapeHtml(m.caption || 'Video')}" style="filter: brightness(0.85);">
                <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">
                  <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #ffffff;">
                    <svg style="width: 24px; height: 24px; fill: currentColor;" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
                <div style="position: absolute; bottom: 8px; left: 8px; font-size: 11px; color: #ffffff; background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px;">
                  ${m.duration ? formatSeconds(m.duration) : ''} ${m.size ? `• ${m.size}` : ''}
                </div>
              </div>
            `;
          }
        } else {
          innerHtml += `
            <div class="media-placeholder-card" data-filename="${escapeHtml(m.filename || '')}" data-msg-id="${msg.id}" data-filesize="${m.fileSizeBytes || ''}" onclick="window.waOpenMediaModal ? window.waOpenMediaModal() : null" style="cursor: pointer;" title="Click to link WhatsApp/Media folder and play this video">
              <div class="media-placeholder-icon video">
                <svg viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
              </div>
              <div class="media-placeholder-info">
                <div class="media-placeholder-title">${escapeHtml(m.filename || 'Video Attachment')}</div>
                <div class="media-placeholder-meta">${m.duration ? formatSeconds(m.duration) : 'Video'} • Click to link Media folder</div>
                <button type="button" class="btn-locate-media" onclick="event.stopPropagation(); window.waLocateSpecificFile('${escapeHtml(m.filename || '')}', '${msg.id}')">
                  📁 Pilih File Ini
                </button>
              </div>
            </div>
          `;
        }
        if (msg.text) {
          innerHtml += `<div class="message-text">${formatMessageText(msg.text)}</div>`;
        }
      } else if (msg.type === 'audio') {
        const durationSec = msg.audioDuration || 30;
        const durationFormatted = formatSeconds(durationSec);
        innerHtml += `
          <div class="vn-player-box" data-id="${msg.id}" data-duration="${durationSec}">
            <div class="vn-avatar-circle" style="background-color: ${msg.senderColor || '#00a884'};">
              ${msg.fromMe ? 'You' : (msg.senderName ? getInitials(msg.senderName) : 'VN')}
              <div class="vn-mic-badge">
                <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
              </div>
            </div>
            <button class="vn-play-btn" onclick="window.waPlayVoiceNote('${msg.id}', ${durationSec})">
              <svg id="vnIcon_${msg.id}" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <div class="vn-controls">
              <div class="vn-waveform" id="vnWave_${msg.id}">
                ${renderWaveformBars(22)}
              </div>
              <div class="vn-meta">
                <span id="vnTime_${msg.id}">${durationFormatted}</span>
                <span>Voice Note</span>
              </div>
            </div>
          </div>
        `;
      } else if (msg.type === 'location' && msg.location) {
        const loc = msg.location;
        const hasCoords = loc.latitude !== undefined && loc.latitude !== null && loc.longitude !== undefined;
        innerHtml += `
          <div class="location-card">
            <div class="location-map-dummy">
              <svg style="width: 36px; height: 36px;" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            </div>
            <div class="location-meta">
              <div class="location-title">${escapeHtml(loc.name || 'Shared Location')}</div>
              <div class="location-address">${escapeHtml(loc.address || '')}</div>
              ${hasCoords ? `<a class="location-link-btn" href="https://www.google.com/maps?q=${loc.latitude},${loc.longitude}" target="_blank" rel="noopener noreferrer"><svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg> Open in Google Maps</a>` : ''}
            </div>
          </div>
        `;
      } else if (msg.type === 'contact') {
        innerHtml += `
          <div class="vcard-card">
            <div class="vcard-avatar">${getInitials(msg.contactName || 'WA')}</div>
            <div class="vcard-info">
              <div class="vcard-name">${escapeHtml(msg.contactName || 'WhatsApp Contact')}</div>
              <div class="vcard-phone">${escapeHtml(msg.contactPhone || 'Contact Card')}</div>
            </div>
          </div>
        `;
      } else if (msg.type === 'sticker' && msg.media) {
        if (msg.media.url) {
          innerHtml += `
            <div class="sticker-container">
              <img class="sticker-img" src="${msg.media.url}" alt="${msg.media.alt || 'Sticker'}">
            </div>
          `;
        } else {
          innerHtml += `
            <div class="media-placeholder-card" style="padding: 6px 12px; min-width: 120px;">
              <span style="font-size: 20px;">💟</span>
              <span style="font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-left: 6px;">Sticker</span>
            </div>
          `;
        }
      } else {
        // Standard Text Message
        innerHtml += `<div class="message-text">${formatMessageText(msg.text)}</div>`;
      }

      // Timestamp & Delivery Check Status
      const timeOnly = formatTimeOnly(msg.timestamp);
      innerHtml += `
        <span class="message-meta-footer">
          <span>${timeOnly}</span>
          ${msg.fromMe ? renderTickSvg(msg.status) : ''}
        </span>
      `;

      innerHtml += '</div>';
      row.innerHTML = innerHtml;
      fragment.appendChild(row);
    });

    dom.messagesViewport.appendChild(fragment);
  }

  /* ==========================================================================
     IN-CHAT SEARCH HIGHLIGHT & NAVIGATION
     ========================================================================== */
  function applyInChatSearch() {
    const q = state.inChatSearchQuery;
    const chat = state.chats.find(c => c.id === state.activeChatId);
    if (!chat) return;

    if (!q) {
      dom.inChatSearchMatches.textContent = '0 results';
      renderMessages(chat);
      return;
    }

    let matchCount = 0;
    let firstMatchEl = null;

    const msgEls = dom.messagesViewport.querySelectorAll('.message-text');
    msgEls.forEach(el => {
      const origText = el.textContent;
      if (origText.toLowerCase().includes(q)) {
        matchCount++;
        const regex = new RegExp(`(${escapeRegex(q)})`, 'gi');
        el.innerHTML = origText.replace(regex, '<mark class="search-highlight">$1</mark>');
        if (!firstMatchEl) {
          firstMatchEl = el.closest('.message-row');
        }
      }
    });

    dom.inChatSearchMatches.textContent = `${matchCount} ${matchCount === 1 ? 'result' : 'results'}`;

    if (firstMatchEl) {
      firstMatchEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function clearInChatSearch() {
    state.inChatSearchQuery = '';
    dom.inChatSearchInput.value = '';
    const chat = state.chats.find(c => c.id === state.activeChatId);
    if (chat) renderMessages(chat);
  }

  /* ==========================================================================
     VOICE NOTE SIMULATOR (WEB AUDIO SYNTHESIZER)
     ========================================================================== */
  window.waPlayVoiceNote = function (msgId, durationSec) {
    if (state.audioPlayingMsgId === msgId) {
      // Pause
      stopVoiceNote();
      return;
    }

    stopVoiceNote();
    state.audioPlayingMsgId = msgId;
    state.audioProgress = 0;

    const playBtnIcon = document.getElementById(`vnIcon_${msgId}`);
    if (playBtnIcon) {
      playBtnIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`; // Pause icon
    }

    // Check if active chat has real audio file linked
    let realAudioUrl = null;
    if (state.activeChatId) {
      const chat = state.chats.find(c => c.id === state.activeChatId);
      if (chat && chat.messages) {
        const found = chat.messages.find(m => m.id === msgId);
        if (found && found.media && found.media.url) {
          realAudioUrl = found.media.url;
        }
      }
    }

    if (realAudioUrl) {
      try {
        const audio = new Audio(realAudioUrl);
        state.activeAudioEl = audio;
        audio.play().catch(e => {
          console.warn('Audio playback error, fallback to synth:', e);
          playSynthesizedVoiceTone();
        });
        audio.onended = () => stopVoiceNote();
      } catch (e) {
        playSynthesizedVoiceTone();
      }
    } else {
      playSynthesizedVoiceTone();
    }

    const waveContainer = document.getElementById(`vnWave_${msgId}`);
    const timeDisplay = document.getElementById(`vnTime_${msgId}`);
    const bars = waveContainer ? waveContainer.querySelectorAll('.waveform-bar') : [];

    const intervalStep = 200; // ms
    const totalMs = (durationSec || 30) * 1000;

    state.audioInterval = setInterval(() => {
      state.audioProgress += intervalStep;
      const progressRatio = Math.min(1, state.audioProgress / totalMs);

      // Update waveform bars
      const activeBarIdx = Math.floor(progressRatio * bars.length);
      bars.forEach((bar, idx) => {
        bar.classList.toggle('played', idx <= activeBarIdx);
      });

      // Update time display
      const currentSeconds = Math.floor(state.audioProgress / 1000);
      if (timeDisplay) {
        timeDisplay.textContent = formatSeconds(currentSeconds);
      }

      if (state.audioProgress >= totalMs) {
        stopVoiceNote();
      }
    }, intervalStep);
  };

  function stopVoiceNote() {
    if (state.activeAudioEl) {
      try { state.activeAudioEl.pause(); } catch (e) {}
      state.activeAudioEl = null;
    }
    if (state.audioInterval) {
      clearInterval(state.audioInterval);
      state.audioInterval = null;
    }
    if (state.audioPlayingMsgId) {
      const playBtnIcon = document.getElementById(`vnIcon_${state.audioPlayingMsgId}`);
      if (playBtnIcon) {
        playBtnIcon.innerHTML = `<path d="M8 5v14l11-7z"/>`; // Play icon
      }
      state.audioPlayingMsgId = null;
    }
  }

  function playSynthesizedVoiceTone() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }

  function renderWaveformBars(count) {
    let html = '';
    const heights = [8, 14, 20, 12, 18, 22, 16, 24, 18, 10, 14, 20, 24, 16, 12, 22, 18, 14, 10, 18, 14, 8];
    for (let i = 0; i < count; i++) {
      const h = heights[i % heights.length];
      html += `<div class="waveform-bar" style="height: ${h}px;"></div>`;
    }
    return html;
  }

  /* ==========================================================================
     CONTACT & GROUP INFO DRAWER
     ========================================================================== */
  function toggleInfoDrawer() {
    dom.infoDrawer.style.display = dom.infoDrawer.style.display === 'none' ? 'flex' : 'none';
  }

  function closeInfoDrawer() {
    dom.infoDrawer.style.display = 'none';
  }

  function updateInfoDrawer(chat) {
    const avatarBg = chat.avatarColor || getRandomColor(chat.name);
    dom.infoAvatar.style.backgroundColor = avatarBg;
    dom.infoAvatar.innerHTML = chat.isGroup 
      ? `<svg style="width: 50px; height: 50px; fill: #ffffff;" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`
      : getInitials(chat.name);

    if (dom.infoDrawerTitle) {
      dom.infoDrawerTitle.textContent = chat.isGroup ? 'Group Info' : 'Contact Info';
    }
    dom.infoName.textContent = chat.name;
    dom.infoPhone.textContent = chat.phone || (chat.isGroup ? 'WhatsApp Group' : chat.jid);
    dom.infoAbout.textContent = chat.about || (chat.isGroup ? 'No group description provided.' : 'Hey there! I am using WhatsApp.');

    if (chat.isGroup && chat.participants && chat.participants.length > 0) {
      dom.infoParticipantsBox.style.display = 'block';
      dom.infoParticipantsList.innerHTML = chat.participants.map(p => `
        <li style="display: flex; align-items: center; gap: 10px; font-size: 13px;">
          <div class="avatar" style="width: 32px; height: 32px; font-size: 13px; background-color: ${p.color || '#00a884'};">
            ${getInitials(p.name)}
          </div>
          <span style="font-weight: 500;">${escapeHtml(p.name)}</span>
        </li>
      `).join('');
    } else {
      dom.infoParticipantsBox.style.display = 'none';
    }
  }

  /* ==========================================================================
     LIGHTBOX MEDIA PREVIEW & MEDIA MODAL EXPORT
     ========================================================================== */
  window.waOpenLightbox = function (url, caption) {
    dom.lightboxImage.src = url;
    dom.lightboxCaption.textContent = caption || '';
    dom.imageLightboxModal.style.display = 'flex';
  };

  window.waOpenMediaModal = function () {
    openMediaModal();
  };

  function closeLightbox() {
    dom.imageLightboxModal.style.display = 'none';
  }

  /* ==========================================================================
     CHAT EXPORT (TXT / JSON)
     ========================================================================== */
  function exportActiveChat() {
    const chat = state.chats.find(c => c.id === state.activeChatId);
    if (!chat) return;

    // Ensure full message history is loaded
    loadFullChatMessages(chat);

    let content = `========================================\n`;
    content += `WhatsApp Chat History: ${chat.name}\n`;
    content += `Exported on: ${new Date().toLocaleString('en-US')}\n`;
    content += `========================================\n\n`;

    chat.messages.forEach(m => {
      const dateStr = new Date(m.timestamp).toLocaleString('en-US');
      const sender = m.fromMe ? 'You' : (m.senderName || chat.name);
      let text = m.text || '';
      if (m.type === 'audio') text = `[Voice Note (${m.audioDuration || 30} seconds)]`;
      if (m.type === 'image') text = `[Photo: ${m.media ? m.media.caption || 'No caption' : ''}]`;
      if (m.type === 'document') text = `[Document: ${m.media ? m.media.filename : 'File'}]`;
      if (m.type === 'location') text = `[Location: ${m.location ? m.location.name : 'Map'}]`;
      content += `[${dateStr}] ${sender}: ${text}\n`;
    });

    downloadBlob(content, `WhatsApp_Chat_${sanitizeFileName(chat.name)}.txt`, 'text/plain;charset=utf-8');
    showToast(`Chat "${chat.name}" (${chat.messages.length.toLocaleString('en-US')} messages) successfully exported to TXT!`, 'success');
  }

  function exportAllChats() {
    if (!state.chats.length) return;
    showToast('Preparing full chat history...', 'info');
    // Ensure full message history loaded for each chat
    state.chats.forEach(c => loadFullChatMessages(c));
    const dataStr = JSON.stringify(state.chats, null, 2);
    downloadBlob(dataStr, `WhatsApp_Full_Backup_${Date.now()}.json`, 'application/json');
    showToast(`All ${state.chats.length} chat histories successfully exported to JSON!`, 'success');
  }

  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ==========================================================================
     FORMATTER & UTILITY FUNCTIONS
     ========================================================================== */
  function formatWhatsAppTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return formatTimeOnly(timestamp);
    }
    if (isYesterday) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  }

  function formatTimeOnly(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function formatDateSeparator(timestamp) {
    if (!timestamp) return 'Today';
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'TODAY';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';

    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function formatSeconds(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function getMessagePreviewText(msg) {
    if (!msg) return 'No messages yet';
    if (msg.type === 'image') return '📷 Photo' + (msg.text ? ': ' + msg.text : '');
    if (msg.type === 'video') return '🎥 Video' + (msg.text ? ': ' + msg.text : '');
    if (msg.type === 'audio') return '🎤 Voice Note';
    if (msg.type === 'document') {
      const fn = msg.media && msg.media.filename ? msg.media.filename : (msg.text || 'Document');
      return '📄 ' + fn;
    }
    if (msg.type === 'location') return '📍 Location';
    if (msg.type === 'sticker') return '💟 Sticker';
    if (msg.type === 'contact') return '👤 Contact';
    return escapeHtml(msg.text || '');
  }

  function formatMessageText(text) {
    if (!text) return '';
    let formatted = escapeHtml(text);

    // *bold* -> <b>bold</b>
    formatted = formatted.replace(/\*([^\*]+)\*/g, '<b>$1</b>');
    // _italic_ -> <i>italic</i>
    formatted = formatted.replace(/_([^_]+)_/g, '<i>$1</i>');
    // ~strike~ -> <strike>strike</strike>
    formatted = formatted.replace(/~([^~]+)~/g, '<strike>$1</strike>');
    // ```code``` -> <code>code</code>
    formatted = formatted.replace(/```([^`]+)```/g, '<code style="background: rgba(0,0,0,0.2); padding: 2px 4px; border-radius: 4px;">$1</code>');
    
    // Auto-link URLs
    const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    formatted = formatted.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: var(--text-link); text-decoration: underline;">$1</a>');

    return formatted;
  }

  function renderTickSvg(status) {
    // status: 1 = Single tick (sent), 2 = Double blue tick (read)
    if (status === 1) {
      return `<svg class="tick-icon single" viewBox="0 0 16 15"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879l-2.07-1.92a.36.36 0 0 0-.494 0l-.388.388a.36.36 0 0 0 0 .494l2.71 2.71a.36.36 0 0 0 .524-.028l9.66-8.207z"/></svg>`;
    }
    return `<svg class="tick-icon" viewBox="0 0 16 15"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879l-2.07-1.92a.36.36 0 0 0-.494 0l-.388.388a.36.36 0 0 0 0 .494l2.71 2.71a.36.36 0 0 0 .524-.028l5.06-6.407z"/></svg>`;
  }

  function getInitials(name) {
    if (!name) return 'WA';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  function getRandomColor(str) {
    const colors = ['#00a884', '#1f7aec', '#e542a3', '#ff7eb6', '#e2881a', '#8a3ffc', '#128c7e', '#ff4d6d'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  function formatJidToName(jid) {
    if (!jid) return 'Contact';
    const user = jid.split('@')[0];
    if (jid.endsWith('@g.us')) return 'Group (' + user.slice(-4) + ')';
    if (/^\d+$/.test(user)) {
      return '+' + user;
    }
    return user;
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function sanitizeFileName(name) {
    return (name || 'chat').replace(/[^a-zA-Z0-9_\-]/g, '_');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconSvg = type === 'success' 
      ? `<svg style="width: 18px; height: 18px;" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>`
      : (type === 'error'
        ? `<svg style="width: 18px; height: 18px;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`
        : `<svg style="width: 18px; height: 18px; fill: var(--wa-green-primary);" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`);

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3500);
  }

  // Initialize app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
