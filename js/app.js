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
    fileLabel: document.querySelector('.file-label')
  };

  // State management
  const state = {
    comicReader: null,
    zoomLevel: 1,
    fitMode: 'fit', // 'fit', 'width', 'height', 'custom'
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
          zoom.resetZoom();
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

  // Navigation functions
  const navigation = {
    goToFirstPage() {
      console.log('goToFirstPage called');
      if (state.comicReader && state.comicReader.currentPage !== 0) {
        utils.resetEditingState();
        state.comicReader.displayPage(0);
        ui.updateNavButtons();
        zoom.resetZoom();
      }
    },
    
    goToLastPage() {
      console.log('goToLastPage called');
      if (state.comicReader && state.comicReader.currentPage !== state.comicReader.images.length - 1) {
        utils.resetEditingState();
        state.comicReader.displayPage(state.comicReader.images.length - 1);
        ui.updateNavButtons();
        zoom.resetZoom();
      }
    },
    
    goToPrevPage() {
      console.log('goToPrevPage called');
      if (state.comicReader && state.comicReader.currentPage > 0) {
        utils.resetEditingState();
        state.comicReader.displayPage(state.comicReader.currentPage - 1);
        ui.updateNavButtons();
        zoom.resetZoom();
      }
    },
    
    goToNextPage() {
      console.log('goToNextPage called');
      if (state.comicReader && state.comicReader.currentPage < state.comicReader.images.length - 1) {
        utils.resetEditingState();
        state.comicReader.displayPage(state.comicReader.currentPage + 1);
        ui.updateNavButtons();
        zoom.resetZoom();
      }
    }
  };

  // Zoom functionality
  const zoom = {
    getImageEl() {
      return elements.comicPage ? elements.comicPage.querySelector('img') : null;
    },

    applyZoom() {
      const img = this.getImageEl();
      if (!img) return;
      
      const zoomStyles = {
        fit: {
          transform: '',
          maxWidth: '100vw',
          maxHeight: '100vh',
          width: 'auto',
          height: 'auto'
        },
        width: {
          transform: '',
          width: '100vw',
          height: 'auto',
          maxWidth: 'none',
          maxHeight: 'none'
        },
        height: {
          transform: '',
          height: '100vh',
          width: 'auto',
          maxWidth: 'none',
          maxHeight: 'none'
        },
        custom: {
          maxWidth: 'none',
          maxHeight: 'none',
          width: 'auto',
          height: 'auto',
          transform: `scale(${state.zoomLevel})`
        }
      };
      
      Object.assign(img.style, zoomStyles[state.fitMode]);
    },

    zoomIn() {
      state.fitMode = 'custom';
      state.zoomLevel = Math.min(state.zoomLevel * 1.03, 8);
      this.applyZoom();
    },

    zoomOut() {
      state.fitMode = 'custom';
      state.zoomLevel = Math.max(state.zoomLevel / 1.03, 0.1);
      this.applyZoom();
    },

    resetZoom() {
      state.fitMode = 'fit';
      state.zoomLevel = 1;
      this.applyZoom();
    },

    fitToWidth() {
      state.fitMode = 'width';
      state.zoomLevel = 1;
      this.applyZoom();
    },

    fitToHeight() {
      state.fitMode = 'height';
      state.zoomLevel = 1;
      this.applyZoom();
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
          zoom.resetZoom();
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
          '0': () => zoom.resetZoom()
        };
        
        if (keyHandlers[e.key]) {
          keyHandlers[e.key]();
        }
      });
    },

    setupMouseWheel() {
      if (elements.comicPage) {
        elements.comicPage.addEventListener('wheel', (e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) zoom.zoomIn();
            else zoom.zoomOut();
          }
        }, { passive: false });
      }
    },

    setupPanning() {
      if (!elements.comicPage) return;
      
      elements.comicPage.addEventListener('mousedown', (e) => {
        if (state.fitMode !== 'custom') return;
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

  // Override ComicReader displayPage to ensure proper updates
  const origDisplayPage = window.ComicReader.prototype.displayPage;
  window.ComicReader.prototype.displayPage = function(index) {
    console.log('displayPage called with index:', index);
    origDisplayPage.call(this, index);
    setTimeout(() => {
      zoom.applyZoom();
      ui.updateNavButtons();
    }, 10);
  };

  // Initialize event handlers
  eventHandlers.setupDragAndDrop();
  eventHandlers.setupFileInput();
  eventHandlers.setupKeyboard();
  eventHandlers.setupMouseWheel();
  eventHandlers.setupPanning();

  // Debug functions
  window._comicReader = () => state.comicReader;
  window.forceUpdatePageCounter = () => {
    if (!state.comicReader) {
      console.log('No comic reader to update');
      return;
    }
    console.log('Force updating page counter...');
    utils.resetEditingState();
    ui.updateNavButtons();
  };
} 