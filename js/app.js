// No imports; use global window objects

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
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
    fileLabel: document.querySelector('.file-label'),
    zoomIndicator: document.getElementById('zoomIndicator')
  };

  // State management
  const state = {
    comicReader: null,
    zoomLevel: 1,
    fitMode: 'fit', // 'fit', 'width', 'height', 'custom'
    isEditingPage: false,
    isPanning: false,
    panStart: { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 },
    // New zoom state
    zoomState: {
      level: 1,
      targetLevel: 1,
      isAnimating: false,
      lastWheelTime: 0,
      wheelDelta: 0,
      naturalSize: { width: 0, height: 0 },
      containerSize: { width: 0, height: 0 },
      fitLevels: { width: 1, height: 1, fit: 1 },
      currentFitMode: 'none' // 'none', 'height', 'width', 'fit'
    }
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
      
      elements.navControls.innerHTML = `
        <button id="firstPageBtn" title="First Page">⏮</button>
        <button id="prevPageBtn" title="Previous Page">⟨</button>
        <span id="pageCounter" title="Click to edit page number">1 / 1</span>
        <button id="nextPageBtn" title="Next Page">⟩</button>
        <button id="lastPageBtn" title="Last Page">⏭</button>
      `;
      
      this.attachNavListeners();
    },

    attachNavListeners() {
      console.log('Attaching nav listeners...');
      
      const buttons = {
        firstPageBtn: document.getElementById('firstPageBtn'),
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        lastPageBtn: document.getElementById('lastPageBtn'),
        pageCounter: document.getElementById('pageCounter')
      };
      
      console.log('Found buttons:', buttons);
      
      // Attach listeners with consistent pattern
      const buttonHandlers = {
        firstPageBtn: () => navigation.goToFirstPage(),
        prevPageBtn: () => navigation.goToPrevPage(),
        nextPageBtn: () => navigation.goToNextPage(),
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
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
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
      const buttonStates = {
        prevPageBtn: currentPage === 0,
        firstPageBtn: currentPage === 0,
        nextPageBtn: currentPage === totalPages - 1,
        lastPageBtn: currentPage === totalPages - 1
      };
      
      Object.entries(buttonStates).forEach(([key, disabled]) => {
        buttons[key].disabled = disabled;
      });
      
      console.log('Button states:', Object.fromEntries(
        Object.entries(buttonStates).map(([key, disabled]) => [key, disabled ? 'disabled' : 'enabled'])
      ));
      
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

  // Advanced Zoom functionality
  const zoom = {
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 8,
    ZOOM_STEP: 0.1,
    SNAP_THRESHOLD: 0.05, // 5% threshold for snapping
    ANIMATION_DURATION: 300, // ms

    getImageEl() {
      return elements.comicPage ? elements.comicPage.querySelector('img') : null;
    },

    // Calculate fit levels for different modes
    calculateFitLevels() {
      const img = this.getImageEl();
      if (!img) {
        console.log('No image element found for fit calculation');
        return;
      }

      if (!img.naturalWidth || !img.naturalHeight) {
        console.log('Image natural dimensions not available yet');
        return;
      }

      const container = elements.comicPage;
      if (!container) {
        console.log('Container element not found for fit calculation');
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      console.log('Container size:', containerRect.width, 'x', containerRect.height);
      console.log('Natural image size:', naturalWidth, 'x', naturalHeight);

      state.zoomState.naturalSize = { width: naturalWidth, height: naturalHeight };
      state.zoomState.containerSize = { width: containerRect.width, height: containerRect.height };

      // Calculate fit levels - scale to fill the target dimension
      // If image is smaller than container, scale UP. If larger, scale DOWN.
      const widthFit = containerRect.width / naturalWidth;  // Scale to fill container width
      const heightFit = containerRect.height / naturalHeight; // Scale to fill container height
      const fitLevel = Math.min(widthFit, heightFit); // Best fit (smaller scale to fit both dimensions)

      state.zoomState.fitLevels = {
        width: widthFit,
        height: heightFit,
        fit: fitLevel
      };

      console.log('Fit levels calculated:', state.zoomState.fitLevels);
      console.log('Width fit will scale to:', (widthFit * 100).toFixed(1) + '%');
      console.log('Height fit will scale to:', (heightFit * 100).toFixed(1) + '%');
    },

    // Smooth zoom animation
    animateZoom(targetLevel, duration = this.ANIMATION_DURATION) {
      if (state.zoomState.isAnimating) return;

      const startLevel = state.zoomState.level;
      const startTime = performance.now();

      state.zoomState.isAnimating = true;
      state.zoomState.targetLevel = targetLevel;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = utils.easeOutCubic(progress);

        const currentLevel = startLevel + (targetLevel - startLevel) * easedProgress;
        this.setZoomLevel(currentLevel);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          state.zoomState.isAnimating = false;
          this.setZoomLevel(targetLevel);
        }
      };

      requestAnimationFrame(animate);
    },

    // Set zoom level with constraints
    setZoomLevel(level) {
      const clampedLevel = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, level));
      state.zoomState.level = clampedLevel;
      this.applyZoom();
    },

    // Apply zoom with smooth transitions
    applyZoom() {
      const img = this.getImageEl();
      if (!img) return;

      const level = state.zoomState.level;
      
      // Add smooth transition
      img.style.transition = `transform ${this.ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      img.style.transform = `scale(${level})`;
      
      // Update zoom indicator
      this.updateZoomIndicator(level);
      
      // Add/remove zoomed class for cursor styling
      if (level > 1) {
        img.classList.add('zoomed');
      } else {
        img.classList.remove('zoomed');
      }
      
      // Remove transition after animation completes
      setTimeout(() => {
        if (img) {
          img.style.transition = '';
        }
      }, this.ANIMATION_DURATION);
    },

    // Update zoom indicator
    updateZoomIndicator(level) {
      if (!elements.zoomIndicator) return;
      
      const percentage = Math.round(level * 100);
      elements.zoomIndicator.textContent = `${percentage}%`;
      
      // Show indicator briefly when zooming
      elements.zoomIndicator.classList.add('show');
      clearTimeout(this.zoomIndicatorTimeout);
      this.zoomIndicatorTimeout = setTimeout(() => {
        if (elements.zoomIndicator) {
          elements.zoomIndicator.classList.remove('show');
        }
      }, 1500);
    },

    // Zoom in with smooth animation
    zoomIn() {
      const currentLevel = state.zoomState.level;
      const newLevel = currentLevel * 1.2;
      this.animateZoom(newLevel);
    },

    // Zoom out with smooth animation
    zoomOut() {
      const currentLevel = state.zoomState.level;
      const newLevel = currentLevel / 1.2;
      this.animateZoom(newLevel);
    },

    // Reset zoom with snap-to-fit
    resetZoom() {
      console.log('Resetting zoom...');
      this.calculateFitLevels();
      const defaultLevel = 1.0;
      this.animateZoom(defaultLevel);
    },

    // Fit to width
    fitToWidth() {
      this.calculateFitLevels();
      const widthLevel = state.zoomState.fitLevels.width;
      this.animateZoom(widthLevel);
    },

    // Fit to height
    fitToHeight() {
      this.calculateFitLevels();
      const heightLevel = state.zoomState.fitLevels.height;
      this.animateZoom(heightLevel);
    },

    // Mouse wheel zoom with smooth handling
    handleWheelZoom(deltaY, clientX, clientY) {
      console.log('Wheel zoom triggered, deltaY:', deltaY);
      
      const now = performance.now();
      const timeSinceLastWheel = now - state.zoomState.lastWheelTime;
      
      // Accumulate wheel delta for smoother zooming
      state.zoomState.wheelDelta += deltaY;
      
      // Process accumulated delta every 15ms for even more responsive zooming
      if (timeSinceLastWheel > 15) {
        // Greatly increase sensitivity: much larger multiplier
        const zoomFactor = Math.exp(-state.zoomState.wheelDelta * 0.012); // was 0.0035
        const currentLevel = state.zoomState.level;
        let newLevel = currentLevel * zoomFactor;
        const fitLevel = state.zoomState.fitLevels.fit || 1;
        // Snap if very close and moving toward fit
        const SNAP_RANGE = 0.10; // 10% range for magnetic snap
        if (
          Math.abs(newLevel - fitLevel) < SNAP_RANGE &&
          ((currentLevel > fitLevel && newLevel < fitLevel) || (currentLevel < fitLevel && newLevel > fitLevel))
        ) {
          newLevel = fitLevel;
        }
        this.animateZoom(newLevel, 60); // Even faster animation for wheel zoom
        state.zoomState.wheelDelta = 0;
        state.zoomState.lastWheelTime = now;
      }
    },

    // Check if we should snap to fit
    checkSnapToFit() {
      const currentLevel = state.zoomState.level;
      const fitLevel = state.zoomState.fitLevels.fit;
      
      if (Math.abs(currentLevel - fitLevel) < this.SNAP_THRESHOLD) {
        this.animateZoom(fitLevel);
        return true;
      }
      
      return false;
    },

    // Initialize zoom for new image
    initializeZoom() {
      const img = this.getImageEl();
      if (!img) return;

      // Reset zoom state to 100%
      state.zoomState.level = 1.0;
      state.zoomState.targetLevel = 1.0;
      state.zoomState.isAnimating = false;
      state.zoomState.currentFitMode = 'none';
      // Wait for image to load natural dimensions
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        console.log('Image not loaded yet, waiting for onload...');
        img.onload = () => {
          console.log('Image loaded, natural size:', img.naturalWidth, 'x', img.naturalHeight);
          this.calculateFitLevels();
          this.animateZoom(1.0);
        };
      } else {
        console.log('Image already loaded, natural size:', img.naturalWidth, 'x', img.naturalHeight);
        this.calculateFitLevels();
        this.animateZoom(1.0);
      }
    },

    // Replace cycleFitMode with toggleFitMode for double-click
    // Only toggle between 100% and fit-to-width
    toggleFitMode() {
      const EPSILON = 0.01;
      const currentLevel = state.zoomState.level;
      const widthFit = state.zoomState.fitLevels.width;
      // If not at 100%, go to 100%
      if (Math.abs(currentLevel - 1.0) > EPSILON && Math.abs(currentLevel - widthFit) > EPSILON) {
        state.zoomState.currentFitMode = 'none';
        this.animateZoom(1.0, 150);
      } else if (Math.abs(currentLevel - 1.0) < EPSILON) {
        // If at 100%, go to fit-to-width
        state.zoomState.currentFitMode = 'width';
        this.animateZoom(widthFit, 150);
      } else if (Math.abs(currentLevel - widthFit) < EPSILON) {
        // If at fit-to-width, go to 100%
        state.zoomState.currentFitMode = 'none';
        this.animateZoom(1.0, 150);
      } else {
        // Fallback: go to 100%
        state.zoomState.currentFitMode = 'none';
        this.animateZoom(1.0, 150);
      }
    }
  };

  // File handling
  const fileHandler = {
    async processFile(file) {
      ui.resetUI();
      try {
        utils.showProgress(5, 'Validating file...');
        const result = await window.handleFileInput(file, utils.showProgress);
        if (result && result.images && result.images.length) {
          state.comicReader = new window.ComicReader(result.images);
          ui.showReader();
          state.comicReader.displayPage(0);
          ui.updateNavButtons();
          zoom.initializeZoom();
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
          'F': () => this.toggleFullscreen(),
          '+': () => zoom.zoomIn(),
          '=': () => zoom.zoomIn(),
          '-': () => zoom.zoomOut(),
          '0': () => zoom.resetZoom(),
          'w': () => zoom.fitToWidth(),
          'h': () => zoom.fitToHeight()
        };
        
        if (keyHandlers[e.key]) {
          e.preventDefault();
          keyHandlers[e.key]();
        }
      });
    },

    setupMouseWheel() {
      if (elements.comicPage) {
        elements.comicPage.addEventListener('wheel', (e) => {
          console.log('Wheel event detected:', { ctrlKey: e.ctrlKey, metaKey: e.metaKey, deltaY: e.deltaY });
          
          // Handle Ctrl/Cmd + wheel zoom
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoom.handleWheelZoom(e.deltaY, e.clientX, e.clientY);
          }
          // Handle trackpad pinch-to-zoom (larger delta values)
          else if (Math.abs(e.deltaY) > 50) {
            e.preventDefault();
            zoom.handleWheelZoom(e.deltaY, e.clientX, e.clientY);
          }
        }, { passive: false });
      }
    },

    setupDoubleClick() {
      if (elements.comicPage) {
        elements.comicPage.addEventListener('dblclick', (e) => {
          e.preventDefault();
          if (e.target.tagName === 'IMG') {
            zoom.toggleFitMode();
          }
        });
      }
    },

    setupPanning() {
      if (!elements.comicPage) return;
      
      elements.comicPage.addEventListener('mousedown', (e) => {
        if (state.zoomState.level <= 1) return; // Only pan when zoomed in
        
        state.isPanning = true;
        elements.comicPage.style.cursor = 'grabbing';
        state.panStart.x = e.pageX - elements.comicPage.offsetLeft;
        state.panStart.y = e.pageY - elements.comicPage.offsetTop;
        state.panStart.scrollLeft = elements.comicPage.scrollLeft;
        state.panStart.scrollTop = elements.comicPage.scrollTop;
      });
      
      elements.comicPage.addEventListener('mouseleave', () => {
        state.isPanning = false;
        elements.comicPage.style.cursor = '';
      });
      
      elements.comicPage.addEventListener('mouseup', () => {
        state.isPanning = false;
        elements.comicPage.style.cursor = '';
      });
      
      elements.comicPage.addEventListener('mousemove', (e) => {
        if (!state.isPanning) return;
        e.preventDefault();
        const x = e.pageX - elements.comicPage.offsetLeft;
        const y = e.pageY - elements.comicPage.offsetTop;
        elements.comicPage.scrollLeft = state.panStart.scrollLeft - (x - state.panStart.x);
        elements.comicPage.scrollTop = state.panStart.scrollTop - (y - state.panStart.y);
      });
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

  // --- Clean, robust zoom and navigation code ---

  let currentScale = 1.0;
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 8.0;
  let panX = 0;
  let panY = 0;

  function setImageTransform(img) {
    img.style.transition = 'none';
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})`;
  }

  function resetTransform(img) {
    currentScale = 1.0;
    panX = 0;
    panY = 0;
    setImageTransform(img);
  }

  function setupZoomAndPan(img) {
    resetTransform(img);

    // Remove all previous listeners
    img.onwheel = null;
    img.ontouchstart = null;
    img.ontouchmove = null;
    img.ontouchend = null;
    img.ondblclick = null;
    img.onmousedown = null;
    img.onmousemove = null;
    img.onmouseup = null;
    img.onmouseleave = null;

    // --- Wheel/trackpad zoom ---
    img.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        let delta = e.deltaY;
        if (Math.abs(delta) < 10) {
          // Trackpad: linear scaling
          currentScale += delta * -0.01;
        } else {
          // Mouse wheel: multiplicative
          let zoomFactor = delta > 0 ? 0.95 : 1.05;
          currentScale = currentScale * zoomFactor;
        }
        currentScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale));
        setImageTransform(img);
      }
    }, { passive: false });

    // --- Double-click/double-tap to reset zoom ---
    img.addEventListener('dblclick', (e) => {
      e.preventDefault();
      resetTransform(img);
    });

    // --- Pinch zoom and swipe for mobile ---
    let lastDist = null;
    let lastTouchMid = null;
    let lastPan = null;
    let swipeStartX = null;
    let swipeStartY = null;
    let isPinching = false;
    let isPanning = false;

    img.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        lastTouchMid = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
        lastPan = { x: panX, y: panY };
      } else if (e.touches.length === 1) {
        isPinching = false;
        isPanning = false;
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
      }
    });

    img.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && lastDist !== null) {
        e.preventDefault();
        // Pinch zoom
        const newDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        let zoomFactor = newDist / lastDist;
        currentScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale * zoomFactor));
        // Pan with pinch
        const newMid = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
        panX = lastPan.x + (newMid.x - lastTouchMid.x);
        panY = lastPan.y + (newMid.y - lastTouchMid.y);
        setImageTransform(img);
        lastDist = newDist;
      }
    }, { passive: false });

    img.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        lastDist = null;
        lastTouchMid = null;
        lastPan = null;
      }
      // Swipe navigation
      if (swipeStartX !== null && e.changedTouches.length === 1) {
        const endX = e.changedTouches[0].clientX;
        const dx = endX - swipeStartX;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.changedTouches[0].clientY - swipeStartY)) {
          if (dx < 0) {
            if (window._comicReader() && window._comicReader().nextPage) window._comicReader().nextPage();
          } else {
            if (window._comicReader() && window._comicReader().prevPage) window._comicReader().prevPage();
          }
        }
        swipeStartX = null;
        swipeStartY = null;
      }
    });

    // --- Mouse drag panning when zoomed in ---
    let mouseDown = false;
    let mouseStart = { x: 0, y: 0 };
    let panStart = { x: 0, y: 0 };
    img.addEventListener('mousedown', (e) => {
      if (currentScale > 1.01) {
        mouseDown = true;
        mouseStart = { x: e.clientX, y: e.clientY };
        panStart = { x: panX, y: panY };
        img.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (mouseDown) {
        panX = panStart.x + (e.clientX - mouseStart.x);
        panY = panStart.y + (e.clientY - mouseStart.y);
        setImageTransform(img);
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (mouseDown) {
        mouseDown = false;
        img.style.cursor = '';
      }
    });
    img.addEventListener('mouseleave', (e) => {
      if (mouseDown) {
        mouseDown = false;
        img.style.cursor = '';
      }
    });
  }

  // Patch ComicReader to setup zoom/pan/swipe on every page
  const origDisplayPage = window.ComicReader.prototype.displayPage;
  window.ComicReader.prototype.displayPage = function(index) {
    origDisplayPage.call(this, index);
    setTimeout(() => {
      const img = this.pageContainer.querySelector('img');
      if (img) setupZoomAndPan(img);
      ui.updateNavButtons();
    }, 10);
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
  window.testZoom = () => {
    console.log('Testing zoom functionality...');
    console.log('Current zoom state:', state.zoomState);
    console.log('Image element:', zoom.getImageEl());
    if (zoom.getImageEl()) {
      console.log('Image natural size:', zoom.getImageEl().naturalWidth, 'x', zoom.getImageEl().naturalHeight);
    }
    zoom.calculateFitLevels();
  };
} 