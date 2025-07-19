// No imports; use global window objects

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const errorContainer = document.getElementById('errorContainer');
  const readerContainer = document.getElementById('readerContainer');
  const comicPage = document.getElementById('comicPage');
  const siteHeader = document.getElementById('siteHeader');
  const navControls = document.getElementById('navControls');

  let comicReader = null;
  let zoomLevel = 1;
  let fitMode = 'fit'; // 'fit', 'width', 'height', 'custom'
  let isEditingPage = false; // Track if we're editing page number

  function showError(message) {
    console.error('Error:', message);
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'flex';
      setTimeout(() => {
        if (errorContainer) errorContainer.style.display = 'none';
      }, 4000);
    }
  }

  function showProgress(percent, text) {
    if (progressContainer && progressBar && progressText) {
      progressContainer.style.display = 'flex';
      progressBar.style.width = percent + '%';
      progressText.textContent = text || '';
    }
  }

  function hideProgress() {
    if (progressContainer && progressBar && progressText) {
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
      progressText.textContent = '';
    }
  }

  function showReader() {
    if (dropZone) dropZone.style.display = 'none';
    if (readerContainer) readerContainer.style.display = 'flex';
    if (siteHeader) siteHeader.hidden = true;
    renderNavControls();
  }

  function resetUI() {
    if (dropZone) dropZone.style.display = '';
    if (readerContainer) readerContainer.style.display = 'none';
    if (siteHeader) siteHeader.hidden = false;
    hideProgress();
  }

  // Drag-and-drop events
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      });
    });
    dropZone.addEventListener('drop', async e => {
      const files = e.dataTransfer.files;
      if (files.length) {
        await processFile(files[0]);
      }
    });
    dropZone.addEventListener('click', () => {
      if (fileInput) fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', async e => {
      if (fileInput.files.length) {
        await processFile(fileInput.files[0]);
      }
    });
  }

  const fileLabel = document.querySelector('.file-label');
  if (fileLabel) {
    fileLabel.addEventListener('click', e => {
      e.preventDefault();
      if (fileInput) fileInput.click();
    });
  }

  async function processFile(file) {
    resetUI();
    try {
      showProgress(5, 'Validating file...');
      // TODO: Add support for CBR, CB7, and more formats using 7zip-wasm/libarchive.js
      const result = await window.handleFileInput(file, showProgress);
      if (result && result.images && result.images.length) {
        comicReader = new window.ComicReader(result.images);
        showReader();
        comicReader.displayPage(0);
        updateNavButtons();
        resetZoom();
      } else {
        showError('No images found in archive.');
      }
    } catch (err) {
      showError(err.message || 'Failed to open file.');
    } finally {
      hideProgress();
    }
  }

  function renderNavControls() {
    if (!navControls) {
      console.error('navControls element not found');
      return;
    }
    
    navControls.innerHTML = `
      <button id="firstPageBtn" title="First Page">⏮</button>
      <button id="prevPageBtn" title="Previous Page">⟨</button>
      <span id="pageCounter" title="Click to edit page number">1 / 1</span>
      <button id="nextPageBtn" title="Next Page">⟩</button>
      <button id="lastPageBtn" title="Last Page">⏭</button>
    `;
    
    // Attach listeners immediately
    attachNavListeners();
  }

  function attachNavListeners() {
    console.log('Attaching nav listeners...');
    
    const firstPageBtn = document.getElementById('firstPageBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const lastPageBtn = document.getElementById('lastPageBtn');
    const pageCounter = document.getElementById('pageCounter');
    
    console.log('Found buttons:', { firstPageBtn, prevPageBtn, nextPageBtn, lastPageBtn, pageCounter });
    
    if (firstPageBtn) {
      firstPageBtn.addEventListener('click', (e) => {
        console.log('First page clicked', e);
        e.preventDefault();
        e.stopPropagation();
        goToFirstPage();
      });
      firstPageBtn.style.cursor = 'pointer';
      console.log('First page button listener attached');
    } else {
      console.error('firstPageBtn not found');
    }
    
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', (e) => {
        console.log('Prev page clicked', e);
        e.preventDefault();
        e.stopPropagation();
        goToPrevPage();
      });
      prevPageBtn.style.cursor = 'pointer';
      console.log('Prev page button listener attached');
    } else {
      console.error('prevPageBtn not found');
    }
    
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', (e) => {
        console.log('Next page clicked', e);
        e.preventDefault();
        e.stopPropagation();
        goToNextPage();
      });
      nextPageBtn.style.cursor = 'pointer';
      console.log('Next page button listener attached');
    } else {
      console.error('nextPageBtn not found');
    }
    
    if (lastPageBtn) {
      lastPageBtn.addEventListener('click', (e) => {
        console.log('Last page clicked', e);
        e.preventDefault();
        e.stopPropagation();
        goToLastPage();
      });
      lastPageBtn.style.cursor = 'pointer';
      console.log('Last page button listener attached');
    } else {
      console.error('lastPageBtn not found');
    }
    
    if (pageCounter) {
      pageCounter.addEventListener('click', (e) => {
        console.log('Page counter clicked', e);
        e.preventDefault();
        e.stopPropagation();
        startPageEdit();
      });
      pageCounter.style.cursor = 'pointer';
      console.log('Page counter listener attached');
    } else {
      console.error('pageCounter not found');
    }
    
    updateNavButtons();
  }

  function startPageEdit() {
    if (!comicReader) return;
    
    const pageCounter = document.getElementById('pageCounter');
    if (!pageCounter) return;
    
    const currentPage = comicReader.currentPage + 1;
    const totalPages = comicReader.images.length;
    
    // Set editing flag to prevent UI hiding
    isEditingPage = true;
    
    // Add editing class to keep nav controls visible
    if (navControls) {
      navControls.classList.add('editing');
    }
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'number';
    input.min = 1;
    input.max = totalPages;
    input.value = currentPage;
    input.className = 'page-edit-input';
    input.style.cssText = `
      width: 40px;
      height: 20px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      text-align: center;
      border-radius: 6px;
      font-size: 0.9rem;
      font-family: inherit;
      outline: none;
      margin: 0 2px;
    `;
    
    // Replace pageCounter content with input
    pageCounter.innerHTML = '';
    pageCounter.appendChild(input);
    pageCounter.appendChild(document.createTextNode(` / ${totalPages}`));
    
    // Focus and select input
    input.focus();
    input.select();
    
    // Handle input events
    function handleInputSubmit() {
      const newPage = parseInt(input.value);
      if (newPage >= 1 && newPage <= totalPages) {
        comicReader.displayPage(newPage - 1);
        updateNavButtons();
        resetZoom();
      }
      // Restore pageCounter and clear editing flag
      isEditingPage = false;
      if (navControls) {
        navControls.classList.remove('editing');
      }
      updateNavButtons();
    }
    
    function handleInputCancel() {
      isEditingPage = false;
      if (navControls) {
        navControls.classList.remove('editing');
      }
      updateNavButtons();
    }
    
    input.addEventListener('blur', handleInputSubmit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleInputSubmit();
      } else if (e.key === 'Escape') {
        handleInputCancel();
      }
    });
  }

  function updateNavButtons() {
    if (!comicReader) {
      console.log('updateNavButtons: comicReader is null');
      return;
    }
    
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const firstPageBtn = document.getElementById('firstPageBtn');
    const lastPageBtn = document.getElementById('lastPageBtn');
    const pageCounter = document.getElementById('pageCounter');
    
    if (!prevPageBtn || !nextPageBtn || !firstPageBtn || !lastPageBtn || !pageCounter) {
      console.error('Navigation buttons not found in updateNavButtons');
      return;
    }
    
    const currentPage = comicReader.currentPage;
    const totalPages = comicReader.images.length;
    
    console.log('Updating nav buttons:', { currentPage, totalPages, isEditingPage });
    
    // Update button states
    const prevDisabled = currentPage === 0;
    const firstDisabled = currentPage === 0;
    const nextDisabled = currentPage === totalPages - 1;
    const lastDisabled = currentPage === totalPages - 1;
    
    // Store previous states to detect changes
    const prevFirstDisabled = firstPageBtn.disabled;
    const prevPrevDisabled = prevPageBtn.disabled;
    
    prevPageBtn.disabled = prevDisabled;
    firstPageBtn.disabled = firstDisabled;
    nextPageBtn.disabled = nextDisabled;
    lastPageBtn.disabled = lastDisabled;
    
    // Log state changes
    if (prevFirstDisabled !== firstDisabled) {
      console.log(`First page button ${firstDisabled ? 'disabled' : 'enabled'}`);
    }
    if (prevPrevDisabled !== prevDisabled) {
      console.log(`Prev page button ${prevDisabled ? 'disabled' : 'enabled'}`);
    }
    
    console.log('Button states:', {
      first: firstDisabled ? 'disabled' : 'enabled',
      prev: prevDisabled ? 'disabled' : 'enabled', 
      next: nextDisabled ? 'disabled' : 'enabled',
      last: lastDisabled ? 'disabled' : 'enabled'
    });
    
    // Always update pageCounter when not editing
    if (!isEditingPage) {
      // Remove any existing input if we're not editing
      const existingInput = pageCounter.querySelector('input');
      if (existingInput) {
        existingInput.remove();
      }
      
      pageCounter.textContent = `${currentPage + 1} / ${totalPages}`;
      console.log('Updated page counter to:', pageCounter.textContent);
    } else {
      console.log('Skipping page counter update - currently editing');
    }
  }

  // Add a test function to verify navigation works
  function testNavigation() {
    if (!comicReader) {
      console.log('No comic loaded for testing');
      return;
    }
    
    console.log('Testing navigation...');
    console.log('Current page:', comicReader.currentPage);
    console.log('Total pages:', comicReader.images.length);
    
    // Test next page if possible
    if (comicReader.currentPage < comicReader.images.length - 1) {
      console.log('Testing next page navigation...');
      goToNextPage();
    } else {
      console.log('Already on last page, testing previous page...');
      goToPrevPage();
    }
  }

  // Expose test function globally
  window.testNavigation = testNavigation;

  function goToFirstPage() {
    console.log('goToFirstPage called');
    if (comicReader && comicReader.currentPage !== 0) {
      // Reset editing state
      isEditingPage = false;
      if (navControls) {
        navControls.classList.remove('editing');
      }
      
      comicReader.displayPage(0);
      updateNavButtons();
      resetZoom();
    }
  }
  
  function goToLastPage() {
    console.log('goToLastPage called');
    if (comicReader && comicReader.currentPage !== comicReader.images.length - 1) {
      // Reset editing state
      isEditingPage = false;
      if (navControls) {
        navControls.classList.remove('editing');
      }
      
      comicReader.displayPage(comicReader.images.length - 1);
      updateNavButtons();
      resetZoom();
    }
  }
  
  function goToPrevPage() {
    console.log('goToPrevPage called');
    if (comicReader && comicReader.currentPage > 0) {
      // Reset editing state
      isEditingPage = false;
      if (navControls) {
        navControls.classList.remove('editing');
      }
      
      comicReader.displayPage(comicReader.currentPage - 1);
      updateNavButtons();
      resetZoom();
    }
  }
  
  function goToNextPage() {
    console.log('goToNextPage called');
    if (comicReader && comicReader.currentPage < comicReader.images.length - 1) {
      // Reset editing state
      isEditingPage = false;
      if (navControls) {
        navControls.classList.remove('editing');
      }
      
      comicReader.displayPage(comicReader.currentPage + 1);
      updateNavButtons();
      resetZoom();
    }
  }

  document.addEventListener('keydown', e => {
    if (!comicReader) return;
    if (e.key === 'ArrowLeft') goToPrevPage();
    if (e.key === 'ArrowRight') goToNextPage();
    if (e.key === 'Home') goToFirstPage();
    if (e.key === 'End') goToLastPage();
    if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    if (e.key === '+' || e.key === '=') zoomIn();
    if (e.key === '-') zoomOut();
    if (e.key === '0') resetZoom();
  });

  function toggleFullscreen() {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  // --- ZOOM & SCROLL ---
  function getImageEl() {
    return comicPage ? comicPage.querySelector('img') : null;
  }

  function applyZoom() {
    const img = getImageEl();
    if (!img) return;
    if (fitMode === 'fit') {
      img.style.transform = '';
      img.style.maxWidth = '100vw';
      img.style.maxHeight = '100vh';
      img.style.width = 'auto';
      img.style.height = 'auto';
    } else if (fitMode === 'width') {
      img.style.transform = '';
      img.style.width = '100vw';
      img.style.height = 'auto';
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
    } else if (fitMode === 'height') {
      img.style.transform = '';
      img.style.height = '100vh';
      img.style.width = 'auto';
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
    } else if (fitMode === 'custom') {
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
      img.style.width = 'auto';
      img.style.height = 'auto';
      img.style.transform = `scale(${zoomLevel})`;
    }
  }

  function zoomIn() {
    fitMode = 'custom';
    zoomLevel = Math.min(zoomLevel * 1.03, 8); // Much less sensitive
    applyZoom();
  }
  function zoomOut() {
    fitMode = 'custom';
    zoomLevel = Math.max(zoomLevel / 1.03, 0.1); // Much less sensitive
    applyZoom();
  }
  function resetZoom() {
    fitMode = 'fit';
    zoomLevel = 1;
    applyZoom();
  }
  function fitToWidth() {
    fitMode = 'width';
    zoomLevel = 1;
    applyZoom();
  }
  function fitToHeight() {
    fitMode = 'height';
    zoomLevel = 1;
    applyZoom();
  }

  // Mouse wheel zoom (much less sensitive)
  if (comicPage) {
    comicPage.addEventListener('wheel', e => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) zoomIn();
        else zoomOut();
      }
    }, { passive: false });
  }

  // Drag to pan when zoomed
  let isPanning = false;
  let startX, startY, scrollLeft, scrollTop;

  if (comicPage) {
    comicPage.addEventListener('mousedown', e => {
      if (fitMode !== 'custom') return;
      isPanning = true;
      comicPage.style.cursor = 'grabbing';
      startX = e.pageX - comicPage.offsetLeft;
      startY = e.pageY - comicPage.offsetTop;
      scrollLeft = comicPage.scrollLeft;
      scrollTop = comicPage.scrollTop;
    });
    
    comicPage.addEventListener('mouseleave', () => {
      isPanning = false;
      comicPage.style.cursor = '';
    });
    
    comicPage.addEventListener('mouseup', () => {
      isPanning = false;
      comicPage.style.cursor = '';
    });
    
    comicPage.addEventListener('mousemove', e => {
      if (!isPanning) return;
      e.preventDefault();
      const x = e.pageX - comicPage.offsetLeft;
      const y = e.pageY - comicPage.offsetTop;
      comicPage.scrollLeft = scrollLeft - (x - startX);
      comicPage.scrollTop = scrollTop - (y - startY);
    });
  }

  // When a new page is displayed, re-apply zoom
  const origDisplayPage = window.ComicReader.prototype.displayPage;
  window.ComicReader.prototype.displayPage = function(index) {
    console.log('displayPage called with index:', index);
    origDisplayPage.call(this, index);
    setTimeout(() => {
      applyZoom();
      // Force update nav buttons after page change
      updateNavButtons();
    }, 10);
  };

  // Force update function for debugging
  function forceUpdatePageCounter() {
    if (!comicReader) {
      console.log('No comic reader to update');
      return;
    }
    
    console.log('Force updating page counter...');
    isEditingPage = false;
    if (navControls) {
      navControls.classList.remove('editing');
    }
    updateNavButtons();
  }

  // Expose for debugging
  window._comicReader = () => comicReader;
  window.forceUpdatePageCounter = forceUpdatePageCounter;
} 