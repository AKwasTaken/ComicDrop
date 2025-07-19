// No imports; use global window objects

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  // Add minimalistic arrows
  const leftArrow = document.createElement('button');
  leftArrow.id = 'edgeLeftArrow';
  leftArrow.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="14" fill="rgba(0,0,0,0.18)"/><path d="M17.5 7L11 14L17.5 21" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  leftArrow.title = 'Previous Page';
  leftArrow.style.position = 'fixed';
  leftArrow.style.left = '10px';
  leftArrow.style.top = '50%';
  leftArrow.style.transform = 'translateY(-50%)';
  leftArrow.style.zIndex = '1001';
  leftArrow.style.background = 'none';
  leftArrow.style.border = 'none';
  leftArrow.style.padding = '0';
  leftArrow.style.cursor = 'pointer';
  leftArrow.style.opacity = '0.8';
  leftArrow.style.display = 'none';
  leftArrow.style.width = '64px';
  leftArrow.style.height = '64px';

  const rightArrow = document.createElement('button');
  rightArrow.id = 'edgeRightArrow';
  rightArrow.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="14" fill="rgba(0,0,0,0.18)"/><path d="M10.5 7L17 14L10.5 21" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  rightArrow.title = 'Next Page';
  rightArrow.style.position = 'fixed';
  rightArrow.style.right = '10px';
  rightArrow.style.top = '50%';
  rightArrow.style.transform = 'translateY(-50%)';
  rightArrow.style.zIndex = '1001';
  rightArrow.style.background = 'none';
  rightArrow.style.border = 'none';
  rightArrow.style.padding = '0';
  rightArrow.style.cursor = 'pointer';
  rightArrow.style.opacity = '0.8';
  rightArrow.style.display = 'none';
  rightArrow.style.width = '64px';
  rightArrow.style.height = '64px';

  document.body.appendChild(leftArrow);
  document.body.appendChild(rightArrow);

  // 1. Increase the size of the edge navigation arrows
  leftArrow.querySelector('svg').setAttribute('width', '48');
  leftArrow.querySelector('svg').setAttribute('height', '48');
  rightArrow.querySelector('svg').setAttribute('width', '48');
  rightArrow.querySelector('svg').setAttribute('height', '48');

  // Navigation logic for arrows
  leftArrow.addEventListener('click', function(e) {
    e.preventDefault();
    if (window._comicReader() && window._comicReader().prevPage) window._comicReader().prevPage();
  });
  rightArrow.addEventListener('click', function(e) {
    e.preventDefault();
    if (window._comicReader() && window._comicReader().nextPage) window._comicReader().nextPage();
  });

  // Show/hide arrows when reader is visible
  const showArrows = () => {
    leftArrow.style.display = 'block';
    rightArrow.style.display = 'block';
  };
  const hideArrows = () => {
    leftArrow.style.display = 'none';
    rightArrow.style.display = 'none';
  };

  // 3. Tap-to-hide/show UI elements
  let uiHidden = false;
  function setUIHidden(hidden) {
    uiHidden = hidden;
    // Hide/show nav controls
    if (document.getElementById('navControls')) {
      document.getElementById('navControls').style.display = hidden ? 'none' : '';
    }
    // Hide/show site header
    if (document.getElementById('siteHeader')) {
      document.getElementById('siteHeader').style.display = hidden ? 'none' : '';
    }
    // Hide/show arrows
    if (hidden) {
      hideArrows();
    } else {
      showArrows();
    }
    // Hide/show fileNameBar
    if (document.getElementById('fileNameBar')) {
      document.getElementById('fileNameBar').style.display = hidden ? 'none' : 'block';
    }
  }

  // Tap/click anywhere on the reader container toggles UI
  if (document.getElementById('readerContainer')) {
    document.getElementById('readerContainer').addEventListener('click', function(e) {
      // Only toggle if not clicking on nav controls or arrows
      if (e.target.closest('#navControls') || e.target.closest('#edgeLeftArrow') || e.target.closest('#edgeRightArrow')) return;
      setUIHidden(!uiHidden);
    });
  }

  // Show arrows when reader is shown, hide otherwise
  const origShowReader = ui.showReader.bind(ui);
  ui.showReader = function() {
    origShowReader();
    const fileNameBar = document.getElementById('fileNameBar');
    if (fileNameBar) {
      fileNameBar.textContent = window.currentFileName || '';
      fileNameBar.style.display = uiHidden ? 'none' : 'block';
    }
    showArrows();
    setUIHidden(false);
  };
  const origResetUI = ui.resetUI.bind(ui);
  ui.resetUI = function() {
    origResetUI();
    hideArrows();
    setUIHidden(false);
  };

  // 3. Add file name display at the top, which hides with UI
  if (!document.getElementById('fileNameBar')) {
    const fileNameBar = document.createElement('div');
    fileNameBar.id = 'fileNameBar';
    fileNameBar.style.position = 'fixed';
    fileNameBar.style.top = '0';
    fileNameBar.style.left = '0';
    fileNameBar.style.right = '0';
    fileNameBar.style.zIndex = '1002';
    fileNameBar.style.background = 'rgba(0,0,0,0.7)';
    fileNameBar.style.color = '#fff';
    fileNameBar.style.fontSize = '1.3em';
    fileNameBar.style.fontWeight = '600';
    fileNameBar.style.textAlign = 'center';
    fileNameBar.style.padding = '12px 0 8px 0';
    fileNameBar.style.display = 'none';
    document.body.appendChild(fileNameBar);
  }

  // Remove previous fileHandler.processFile override for fileNameBar
  // Instead, set the file name globally and update in ui.showReader
  window.currentFileName = '';
});

function initializeApp() {
  // DOM Elements - cache all at once
  const elements = {
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    progressContainer: document.getElementById('progressContainer'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    errorContainer: document.getElementById('errorContainer'),
    readerContainer: document.getElementById('readerContainer'),
    comicPage: document.getElementById('comicPage'),
    siteHeader: document.getElementById('siteHeader'),
    navControls: document.getElementById('navControls'),
    fileLabel: document.querySelector('.file-label')
    // Removed: zoomIndicator
  };

  // State management
  const state = {
    comicReader: null,
    // Removed: zoomLevel, fitMode, zoomState
    isEditingPage: false,
    isPanning: false,
    panStart: { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 }
  };

  // Utility functions
  const utils = {
    showError(message) {
      console.error('Error:', message);
      if (elements.errorContainer) {
        elements.errorContainer.textContent = message;
        elements.errorContainer.style.display = 'flex';
        setTimeout(() => {
          if (elements.errorContainer) elements.errorContainer.style.display = 'none';
        }, 4000);
      }
    },

    showProgress(percent, text) {
      if (elements.progressContainer && elements.progressBar && elements.progressText) {
        elements.progressContainer.style.display = 'flex';
        elements.progressBar.style.width = percent + '%';
        elements.progressText.textContent = text || '';
      }
    },

    hideProgress() {
      if (elements.progressContainer && elements.progressBar && elements.progressText) {
        elements.progressContainer.style.display = 'none';
        elements.progressBar.style.width = '0%';
        elements.progressText.textContent = '';
      }
    },

    resetEditingState() {
      state.isEditingPage = false;
      if (elements.navControls) {
        elements.navControls.classList.remove('editing');
      }
    },

    // Easing functions for smooth animations
    easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    },

    easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    // Debounce function
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  };

  // UI Management
  const ui = {
    showReader() {
      if (elements.dropZone) elements.dropZone.style.display = 'none';
      if (elements.readerContainer) elements.readerContainer.style.display = 'flex';
      if (elements.siteHeader) elements.siteHeader.hidden = true;
      this.renderNavControls();
    },

    resetUI() {
      if (elements.dropZone) elements.dropZone.style.display = '';
      if (elements.readerContainer) elements.readerContainer.style.display = 'none';
      if (elements.siteHeader) elements.siteHeader.hidden = false;
      utils.hideProgress();
    },

    renderNavControls() {
      if (!elements.navControls) {
        console.error('navControls element not found');
        return;
      }
      // Only first/last and page counter in the nav bar
      elements.navControls.innerHTML = `
        <button id="firstPageBtn" title="First Page">⏮</button>
        <span id="pageCounter" title="Click to edit page number">1 / 1</span>
        <button id="lastPageBtn" title="Last Page">⏭</button>
      `;
      this.attachNavListeners();
    },

    attachNavListeners() {
      console.log('Attaching nav listeners...');
      const buttons = {
        firstPageBtn: document.getElementById('firstPageBtn'),
        lastPageBtn: document.getElementById('lastPageBtn'),
        pageCounter: document.getElementById('pageCounter')
      };
      console.log('Found buttons:', buttons);
      const buttonHandlers = {
        firstPageBtn: () => navigation.goToFirstPage(),
        lastPageBtn: () => navigation.goToLastPage(),
        pageCounter: () => this.startPageEdit()
      };
      Object.entries(buttons).forEach(([key, button]) => {
        if (button) {
          button.addEventListener('click', (e) => {
            console.log(`${key} clicked`, e);
            e.preventDefault();
            e.stopPropagation();
            buttonHandlers[key]();
          });
          button.style.cursor = 'pointer';
          console.log(`${key} listener attached`);
        } else {
          console.error(`${key} not found`);
        }
      });
      this.updateNavButtons();
    },

    updateNavButtons() {
      if (!state.comicReader) {
        console.log('updateNavButtons: comicReader is null');
        return;
      }
      const buttons = {
        firstPageBtn: document.getElementById('firstPageBtn'),
        lastPageBtn: document.getElementById('lastPageBtn'),
        pageCounter: document.getElementById('pageCounter')
      };
      if (!Object.values(buttons).every(btn => btn)) {
        console.error('Navigation buttons not found in updateNavButtons');
        return;
      }
      const currentPage = state.comicReader.currentPage;
      const totalPages = state.comicReader.images.length;
      console.log('Updating nav buttons:', { currentPage, totalPages, isEditingPage: state.isEditingPage });
      // Update button states
      buttons.firstPageBtn.disabled = currentPage === 0;
      buttons.lastPageBtn.disabled = currentPage === totalPages - 1;
      // Update page counter when not editing
      if (!state.isEditingPage) {
        const existingInput = buttons.pageCounter.querySelector('input');
        if (existingInput) {
          existingInput.remove();
        }
        buttons.pageCounter.textContent = `${currentPage + 1} / ${totalPages}`;
        console.log('Updated page counter to:', buttons.pageCounter.textContent);
      } else {
        console.log('Skipping page counter update - currently editing');
      }
    },

    startPageEdit() {
      if (!state.comicReader) return;
      
      const pageCounter = document.getElementById('pageCounter');
      if (!pageCounter) return;
      
      const currentPage = state.comicReader.currentPage + 1;
      const totalPages = state.comicReader.images.length;
      
      // Set editing state
      state.isEditingPage = true;
      if (elements.navControls) {
        elements.navControls.classList.add('editing');
      }
      
      // Create input element
      const input = document.createElement('input');
      input.type = 'number';
      input.min = 1;
      input.max = totalPages;
      input.value = currentPage;
      input.className = 'page-edit-input';
      
      // Replace pageCounter content with input
      pageCounter.innerHTML = '';
      pageCounter.appendChild(input);
      pageCounter.appendChild(document.createTextNode(` / ${totalPages}`));
      
      // Focus and select input
      input.focus();
      input.select();
      
      // Handle input events
      const handleInputSubmit = () => {
        const newPage = parseInt(input.value);
        if (newPage >= 1 && newPage <= totalPages) {
          state.comicReader.displayPage(newPage - 1);
          this.updateNavButtons();
          // zoom.resetZoom(); // Removed as Panzoom handles zoom
        }
        utils.resetEditingState();
        this.updateNavButtons();
      };
      
      const handleInputCancel = () => {
        utils.resetEditingState();
        this.updateNavButtons();
      };
      
      input.addEventListener('blur', handleInputSubmit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleInputSubmit();
        } else if (e.key === 'Escape') {
          handleInputCancel();
        }
      });
    }
  };

  // Navigation functionality
  const navigation = {
    goToFirstPage() {
      if (state.comicReader) {
        state.comicReader.displayPage(0);
        ui.updateNavButtons();
      }
    },

    goToLastPage() {
      if (state.comicReader) {
        state.comicReader.displayPage(state.comicReader.images.length - 1);
        ui.updateNavButtons();
      }
    },

    goToPrevPage() {
      if (state.comicReader && state.comicReader.prevPage()) {
        ui.updateNavButtons();
      }
    },

    goToNextPage() {
      if (state.comicReader && state.comicReader.nextPage()) {
        ui.updateNavButtons();
      }
    }
  };

  // Remove the entire advanced zoom object and all its methods
  // const zoom = { ... } (lines 330-591 approx) -- deleted

  // File handling
  const fileHandler = {
    async processFile(file) {
      ui.resetUI();
      try {
        utils.showProgress(5, 'Validating file...');
        const result = await window.handleFileInput(file, utils.showProgress);
        if (result && result.images && result.images.length) {
          // Set and show the file name bar before showing the reader
          window.currentFileName = file.name || '';
          const fileNameBar = document.getElementById('fileNameBar');
          if (fileNameBar) {
            fileNameBar.textContent = window.currentFileName;
            fileNameBar.style.display = '';
          }
          state.comicReader = new window.ComicReader(result.images);
          ui.showReader();
          state.comicReader.displayPage(0);
          ui.updateNavButtons();
        } else {
          utils.showError('No images found in archive.');
        }
      } catch (err) {
        utils.showError(err.message || 'Failed to open file.');
      } finally {
        utils.hideProgress();
      }
    }
  };

  // Event handlers
  const eventHandlers = {
    setupDragAndDrop() {
      if (!elements.dropZone) return;
      
      const dragEvents = ['dragenter', 'dragover', 'dragleave', 'drop'];
      dragEvents.forEach(eventName => {
        elements.dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      });
      
      elements.dropZone.addEventListener('dragenter', () => elements.dropZone.classList.add('dragover'));
      elements.dropZone.addEventListener('dragover', () => elements.dropZone.classList.add('dragover'));
      elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('dragover'));
      elements.dropZone.addEventListener('drop', (e) => {
        elements.dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length) {
          fileHandler.processFile(files[0]);
        }
      });
      
      elements.dropZone.addEventListener('click', () => {
        if (elements.fileInput) elements.fileInput.click();
      });
    },

    setupFileInput() {
      if (elements.fileInput) {
        elements.fileInput.addEventListener('change', (e) => {
          if (elements.fileInput.files.length) {
            fileHandler.processFile(elements.fileInput.files[0]);
          }
        });
      }
      
      if (elements.fileLabel) {
        elements.fileLabel.addEventListener('click', (e) => {
          e.preventDefault();
          if (elements.fileInput) elements.fileInput.click();
        });
      }
    },

    setupKeyboard() {
      document.addEventListener('keydown', (e) => {
        if (!state.comicReader) return;
        
        const keyHandlers = {
          'ArrowLeft': () => navigation.goToPrevPage(),
          'ArrowRight': () => navigation.goToNextPage(),
          'Home': () => navigation.goToFirstPage(),
          'End': () => navigation.goToLastPage(),
          'f': () => this.toggleFullscreen(),
          'F': () => this.toggleFullscreen()
          // Removed: zoom in/out/reset/fit keys
        };
        
        if (keyHandlers[e.key]) {
          e.preventDefault();
          keyHandlers[e.key]();
        }
      });
    },

    setupMouseWheel() {
      // No-op: basic zoom is handled per-image
    },

    setupDoubleClick() {
      // No-op: basic zoom is handled per-image
    },

    setupPanning() {
      // No-op: basic zoom is handled per-image
    },

    toggleFullscreen() {
      const elem = document.documentElement;
      if (!document.fullscreenElement) {
        elem.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  // --- Minimal, robust zoom and navigation from scratch ---

  let zoomScale = 1.0;
  const ZOOM_MIN = 0.1;
  const ZOOM_MAX = 8.0;
  let panOffset = { x: 0, y: 0 };

  function applyTransform(img) {
    img.style.transition = 'none';
    img.style.transform = `translate(${img._panOffset.x}px, ${img._panOffset.y}px) scale(${img._zoomScale})`;
  }

  function resetZoom(img) {
    img._zoomScale = 1.0;
    img._panOffset = { x: 0, y: 0 };
    applyTransform(img);
  }

  function setupZoomHandlers(img, shouldReset = false) {
    // Per-image state
    img._zoomScale = 1.0;
    img._panOffset = { x: 0, y: 0 };
    if (shouldReset) resetZoom(img);

    // Remove all previous listeners
    img.onwheel = null;
    img.ondblclick = null;
    img.onmousedown = null;
    img.onmousemove = null;
    img.onmouseup = null;
    img.onmouseleave = null;
    img.ontouchstart = null;
    img.ontouchmove = null;
    img.ontouchend = null;

    // --- Wheel/trackpad zoom ---
    img.addEventListener('wheel', (e) => {
      e.preventDefault();
      let delta = e.deltaY;
      if (Math.abs(delta) < 10) {
        // Trackpad: linear
        img._zoomScale += delta * -0.01;
      } else {
        // Mouse wheel: multiplicative
        img._zoomScale *= delta > 0 ? 0.95 : 1.05;
      }
      img._zoomScale = Math.max(0.1, Math.min(8.0, img._zoomScale));
      applyTransform(img);
    }, { passive: false });

    // --- Double-click/double-tap to reset zoom ---
    img.addEventListener('dblclick', (e) => {
      e.preventDefault();
      resetZoom(img);
    });

    // --- Mouse drag panning ---
    let dragging = false;
    let dragStart = { x: 0, y: 0 };
    let panStart = { x: 0, y: 0 };
    img.addEventListener('mousedown', (e) => {
      if (img._zoomScale > 1.01) {
        dragging = true;
        dragStart = { x: e.clientX, y: e.clientY };
        panStart = { ...img._panOffset };
        img.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (dragging) {
        img._panOffset.x = panStart.x + (e.clientX - dragStart.x);
        img._panOffset.y = panStart.y + (e.clientY - dragStart.y);
        applyTransform(img);
      }
    });
    window.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        img.style.cursor = '';
      }
    });
    img.addEventListener('mouseleave', () => {
      if (dragging) {
        dragging = false;
        img.style.cursor = '';
      }
    });

    // --- Pinch zoom and swipe for mobile ---
    let pinchLastDist = null;
    let swipeStartX = null;
    let swipeStartY = null;
    // Touch panning state
    let touchPanning = false;
    let touchPanStart = { x: 0, y: 0 };
    let touchPanOffset = { x: 0, y: 0 };
    img.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        pinchLastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchPanning = false;
      } else if (e.touches.length === 1) {
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
        // Enable panning if zoomed in
        if (img._zoomScale > 1.01) {
          touchPanning = true;
          touchPanStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          touchPanOffset = { ...img._panOffset };
        } else {
          touchPanning = false;
        }
      }
    });
    img.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && pinchLastDist !== null) {
        e.preventDefault();
        const newDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        let zoomFactor = newDist / pinchLastDist;
        img._zoomScale = Math.max(0.1, Math.min(8.0, img._zoomScale * zoomFactor));
        applyTransform(img);
        pinchLastDist = newDist;
      } else if (e.touches.length === 1 && touchPanning) {
        e.preventDefault();
        // Pan the image
        const dx = e.touches[0].clientX - touchPanStart.x;
        const dy = e.touches[0].clientY - touchPanStart.y;
        img._panOffset.x = touchPanOffset.x + dx;
        img._panOffset.y = touchPanOffset.y + dy;
        applyTransform(img);
      }
    }, { passive: false });
    img.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        pinchLastDist = null;
      }
      // End panning
      if (e.touches.length === 0) {
        touchPanning = false;
      }
      // Removed: swipe navigation
    });
  }

  // Patch ComicReader to setup zoom/pan/swipe on every page
  const origDisplayPage = window.ComicReader.prototype.displayPage;
  window.ComicReader.prototype.displayPage = function(index) {
    origDisplayPage.call(this, index);
    setTimeout(() => {
      const img = this.pageContainer.querySelector('img');
      if (img) setupZoomHandlers(img, true); // Only reset on new image
      ui.updateNavButtons();
    }, 10);
  };

  // --- Dynamically load unrar.js and 7z-wasm if needed ---
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function loadUnrar() {
    if (window.UNRAR) return Promise.resolve();
    return loadScript('ComicDrop/lib/unrar.min.js');
  }
  function loadJS7z() {
    if (window.JS7z) return Promise.resolve();
    window.Module = window.Module || {};
    window.Module.locateFile = function(path) {
      if (path.endsWith('.wasm')) return 'ComicDrop/lib/7zz.wasm';
      return path;
    };
    return loadScript('ComicDrop/lib/7zz.umd.js');
  }

  // Patch fileHandler.processFile to load libraries as needed
  const origProcessFile = fileHandler.processFile;
  fileHandler.processFile = async function(file) {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'cbr' || ext === 'rar') await loadUnrar();
    if (ext === 'cb7' || ext === '7z') await loadJS7z();
    return origProcessFile.apply(this, arguments);
  };

  // Initialize event handlers
  eventHandlers.setupDragAndDrop();
  eventHandlers.setupFileInput();
  eventHandlers.setupKeyboard();
  eventHandlers.setupMouseWheel();
  eventHandlers.setupDoubleClick();
  eventHandlers.setupPanning();

  // Debug functions
  window._comicReader = () => state.comicReader;
  window.forceUpdatePageCounter = () => {
    if (!state.comicReader) {
      console.log('No comic reader to update');
      return;
    }
    console.log('Force updating page counter...');
    ui.updateNavButtons();
  };
  
  // Test zoom functions
  // window.testZoom = () => {
  //   console.log('Testing zoom functionality...');
  //   console.log('Current zoom state:', state.zoomState);
  //   console.log('Image element:', zoom.getImageEl());
  //   if (zoom.getImageEl()) {
  //     console.log('Image natural size:', zoom.getImageEl().naturalWidth, 'x', zoom.getImageEl().naturalHeight);
  //   }
  //   zoom.calculateFitLevels();
  // };
}