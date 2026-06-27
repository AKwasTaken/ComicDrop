document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  const state = {
    comicReader: null,
    isEditingPage: false,
    spreadMode: false
  };

  const elements = {
    dropZone: document.getElementById('dropZone'),
    readerContainer: document.getElementById('readerContainer'),
    siteHeader: document.getElementById('siteHeader'),
    navControls: document.getElementById('navControls'),
    fileInput: document.getElementById('fileInput'),
    fileNameBar: document.getElementById('fileNameBar'),
    leftArrow: document.getElementById('edgeLeftArrow'),
    rightArrow: document.getElementById('edgeRightArrow'),
    fullscreenBtn: document.getElementById('fullscreenBtn')
  };

  window.ui = {
    showReader() {
      const landingPage = document.getElementById('landingPage');
      if (landingPage) landingPage.style.display = 'none';
      if (elements.readerContainer) elements.readerContainer.style.display = 'flex';
      
      if (elements.siteHeader) {
        Array.from(elements.siteHeader.children).forEach(el => el.style.display = 'none');
      }
      if (elements.fileNameBar) {
        elements.fileNameBar.style.display = 'block';
        elements.fileNameBar.textContent = window.currentFileName || '';
      }
      if (elements.leftArrow) elements.leftArrow.style.display = 'block';
      if (elements.rightArrow) elements.rightArrow.style.display = 'block';
      if (elements.fullscreenBtn) elements.fullscreenBtn.style.display = 'flex';

      this.renderNavControls();
    },

    resetUI() {
      const landingPage = document.getElementById('landingPage');
      if (landingPage) landingPage.style.display = 'flex'; // Brings back the landing page
      if (elements.readerContainer) elements.readerContainer.style.display = 'none';
      
      if (elements.siteHeader) {
        Array.from(elements.siteHeader.children).forEach(el => el.style.display = '');
      }
      if (elements.fileNameBar) elements.fileNameBar.style.display = 'none';
      if (elements.leftArrow) elements.leftArrow.style.display = 'none';
      if (elements.rightArrow) elements.rightArrow.style.display = 'none';
      if (elements.fullscreenBtn) elements.fullscreenBtn.style.display = 'none';
      
      if (window.utils) window.utils.hideProgress();
    },

    renderNavControls() {
      if (!elements.navControls) return;
      elements.navControls.innerHTML = `
        <button id="firstPageBtn" title="First Page">⏮</button>
        <span id="pageCounter" title="Click to edit page number">1 / 1</span>
        <button id="lastPageBtn" title="Last Page">⏭</button>
        <button id="spreadToggleBtn" title="Toggle two-page view" style="margin-left:1.2em;">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
            <rect x="2" y="4" width="8" height="14" rx="2" fill="currentColor" fill-opacity="0.7"/>
            <rect x="12" y="4" width="8" height="14" rx="2" fill="currentColor" fill-opacity="0.4"/>
            <rect x="10.5" y="4" width="1" height="14" fill="currentColor" fill-opacity="0.7"/>
          </svg>
        </button>
      `;
      this.attachNavListeners();
    },

    attachNavListeners() {
      const targets = {
        firstPageBtn: document.getElementById('firstPageBtn'),
        lastPageBtn: document.getElementById('lastPageBtn'),
        pageCounter: document.getElementById('pageCounter'),
        spreadToggleBtn: document.getElementById('spreadToggleBtn')
      };

      if (targets.firstPageBtn) targets.firstPageBtn.onclick = () => navigation.goToFirstPage();
      if (targets.lastPageBtn) targets.lastPageBtn.onclick = () => navigation.goToLastPage();
      if (targets.pageCounter) targets.pageCounter.onclick = () => this.startPageEdit();
      if (targets.spreadToggleBtn) {
        targets.spreadToggleBtn.onclick = () => {
          state.spreadMode = !state.spreadMode;
          if (state.comicReader) {
            state.comicReader.setSpreadMode(state.spreadMode);
            state.comicReader.displayPage(0);
          }
          this.renderNavControls();
        };
      }
      this.updateNavButtons();
    },

    updateNavButtons() {
      if (!state.comicReader) return;
      const buttons = {
        firstPageBtn: document.getElementById('firstPageBtn'),
        lastPageBtn: document.getElementById('lastPageBtn'),
        pageCounter: document.getElementById('pageCounter'),
        spreadToggleBtn: document.getElementById('spreadToggleBtn')
      };

      if (!buttons.firstPageBtn || !buttons.lastPageBtn || !buttons.pageCounter) return;

      const pageInfo = state.comicReader.getPageInfo();
      buttons.firstPageBtn.disabled = !pageInfo.hasPrev;
      buttons.lastPageBtn.disabled = !pageInfo.hasNext;

      if (!state.isEditingPage) {
        if (state.spreadMode) {
          buttons.pageCounter.textContent = `${pageInfo.current} / ${Math.ceil(pageInfo.total === 1 ? 1 : 1 + (pageInfo.total - 1) / 2)}`;
        } else {
          buttons.pageCounter.textContent = `${pageInfo.current} / ${pageInfo.total}`;
        }
      }
      if (buttons.spreadToggleBtn) {
        buttons.spreadToggleBtn.classList.toggle('active', state.spreadMode);
      }
    },

    startPageEdit() {
      if (!state.comicReader) return;
      const pageCounter = document.getElementById('pageCounter');
      if (!pageCounter) return;

      const currentPage = state.comicReader.currentPage + 1;
      const totalPages = state.comicReader.entries.length;

      state.isEditingPage = true;
      const input = document.createElement('input');
      input.type = 'number';
      input.min = 1;
      input.max = totalPages;
      input.value = currentPage;
      input.className = 'page-edit-input';

      pageCounter.innerHTML = '';
      pageCounter.appendChild(input);
      pageCounter.appendChild(document.createTextNode(` / ${totalPages}`));
      input.focus();
      input.select();

      const commit = () => {
        const val = parseInt(input.value);
        if (val >= 1 && val <= totalPages) {
          state.comicReader.displayPage(val - 1);
        }
        state.isEditingPage = false;
        this.updateNavButtons();
      };

      input.onblur = commit;
      input.onkeydown = (e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') {
          state.isEditingPage = false;
          this.updateNavButtons();
        }
      };
    }
  };

  const navigation = {
    goToFirstPage() { if (state.comicReader) state.comicReader.displayPage(0); },
    goToLastPage() { if (state.comicReader) state.comicReader.displayPage(state.comicReader.entries.length - 1); },
    goToPrevPage() { if (state.comicReader) state.comicReader.prevPage(); },
    goToNextPage() { if (state.comicReader) state.comicReader.nextPage(); }
  };

  // Modernized native Zoom Engine implementation context
  window.setupZoomHandlers = function(img, shouldReset) {
    img._zoomScale = 1.0;
    img._panOffset = { x: 0, y: 0 };

    img.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 10) {
        img._zoomScale += e.deltaY * -0.01;
      } else {
        img._zoomScale *= e.deltaY > 0 ? 0.95 : 1.05;
      }
      img._zoomScale = Math.max(0.5, Math.min(6.0, img._zoomScale));
      img.style.transform = `translate(${img._panOffset.x}px, ${img._panOffset.y}px) scale(${img._zoomScale})`;
    }, { passive: false });

    let dragging = false;
    let start = { x: 0, y: 0 };
    img.addEventListener('mousedown', (e) => {
      if (img._zoomScale > 1.05) {
        dragging = true;
        start = { x: e.clientX - img._panOffset.x, y: e.clientY - img._panOffset.y };
        img.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      img._panOffset.x = e.clientX - start.x;
      img._panOffset.y = e.clientY - start.y;
      img.style.transform = `translate(${img._panOffset.x}px, ${img._panOffset.y}px) scale(${img._zoomScale})`;
    });

    window.addEventListener('mouseup', () => {
      dragging = false;
      if (img) img.style.cursor = '';
    });
  };

  // Safe Asset Loading Pipeline
  async function loadLibraryDependency(ext) {
    if ((ext === 'cb7' || ext === '7z') && !window.JS7z) {
      window.Module = window.Module || {};
      window.Module.locateFile = (path) => path.endsWith('.wasm') ? 'lib/7zz.wasm' : path;
      return new Promise((res, rej) => {
        const scr = document.createElement('script');
        scr.src = 'lib/7zz.umd.js';
        scr.onload = res;
        scr.onerror = rej;
        document.head.appendChild(scr);
      });
    }
  }

  // Intercepting core processor file streams
  async function routeArchiveProcessing(file) {
    const ext = file.name.toLowerCase().split('.').pop();
    window.ui.resetUI();
    try {
      if (window.utils) window.utils.showProgress(10, 'Loading core systems...');
      await loadLibraryDependency(ext);
      
      const targetStructure = await window.handleFileInput(file, window.utils ? window.utils.showProgress : () => {});
      if (targetStructure && targetStructure.entries && targetStructure.entries.length) {
        window.currentFileName = file.name || '';
        
        if (state.comicReader) state.comicReader.cleanup();
        state.comicReader = new window.ComicReader(targetStructure.entries, { spreadMode: state.spreadMode });
        
        window.ui.showReader();
        await state.comicReader.displayPage(0);
      }
    } catch (err) {
      if (window.utils) window.utils.showError(err.message || 'Error processing comic book file.');
    }
  }

  // Core Global Interactions Integration Setup
  if (elements.leftArrow) elements.leftArrow.onclick = () => navigation.goToPrevPage();
  if (elements.rightArrow) elements.rightArrow.onclick = () => navigation.goToNextPage();
  if (elements.fullscreenBtn) {
    elements.fullscreenBtn.onclick = () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    };
  }

  if (elements.dropZone) {
    elements.dropZone.ondragover = (e) => { e.preventDefault(); elements.dropZone.classList.add('dragover'); };
    elements.dropZone.ondragleave = () => elements.dropZone.classList.remove('dragover');
    elements.dropZone.ondrop = (e) => {
      e.preventDefault();
      elements.dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) routeArchiveProcessing(e.dataTransfer.files[0]);
    };
    elements.dropZone.onclick = (e) => {
      if (e.target === elements.dropZone && elements.fileInput) elements.fileInput.click();
    };
  }

  if (elements.fileInput) {
    elements.fileInput.onchange = () => {
      if (elements.fileInput.files.length) routeArchiveProcessing(elements.fileInput.files[0]);
    };
  }

  document.onkeydown = (e) => {
    if (!state.comicReader) return;
    if (e.key === 'ArrowLeft') navigation.goToPrevPage();
    if (e.key === 'ArrowRight') navigation.goToNextPage();
    if (e.key === 'Home') navigation.goToFirstPage();
    if (e.key === 'End') navigation.goToLastPage();
  };
}