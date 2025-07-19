// No imports; use global window objects

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const errorContainer = document.getElementById('errorContainer');
const readerContainer = document.getElementById('readerContainer');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

let comicReader = null;

function showError(message) {
  errorContainer.textContent = message;
  errorContainer.style.display = 'flex';
  setTimeout(() => {
    errorContainer.style.display = 'none';
  }, 4000);
}

function showProgress(percent, text) {
  progressContainer.style.display = 'flex';
  progressBar.style.width = percent + '%';
  progressText.textContent = text || '';
}

function hideProgress() {
  progressContainer.style.display = 'none';
  progressBar.style.width = '0%';
  progressText.textContent = '';
}

function showReader() {
  dropZone.style.display = 'none';
  readerContainer.style.display = 'flex';
}

function resetUI() {
  dropZone.style.display = '';
  readerContainer.style.display = 'none';
  hideProgress();
}

// Drag-and-drop events
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

fileInput.addEventListener('change', async e => {
  if (fileInput.files.length) {
    await processFile(fileInput.files[0]);
  }
});

dropZone.addEventListener('click', () => fileInput.click());

document.querySelector('.file-label').addEventListener('click', e => {
  e.preventDefault();
  fileInput.click();
});

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
    } else {
      showError('No images found in archive.');
    }
  } catch (err) {
    showError(err.message || 'Failed to open file.');
  } finally {
    hideProgress();
  }
}

function updateNavButtons() {
  if (!comicReader) return;
  prevPageBtn.disabled = comicReader.currentPage === 0;
  nextPageBtn.disabled = comicReader.currentPage === comicReader.images.length - 1;
}

function goToPrevPage() {
  if (comicReader && comicReader.currentPage > 0) {
    comicReader.displayPage(comicReader.currentPage - 1);
    updateNavButtons();
  } else {
    showError('Already at the first page.');
  }
}

function goToNextPage() {
  if (comicReader && comicReader.currentPage < comicReader.images.length - 1) {
    comicReader.displayPage(comicReader.currentPage + 1);
    updateNavButtons();
  } else {
    showError('Already at the last page.');
  }
}

function toggleFullscreen() {
  const elem = document.documentElement;
  if (!document.fullscreenElement) {
    elem.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

prevPageBtn.addEventListener('click', goToPrevPage);
nextPageBtn.addEventListener('click', goToNextPage);
fullscreenBtn.addEventListener('click', toggleFullscreen);

document.addEventListener('keydown', e => {
  if (!comicReader) return;
  if (e.key === 'ArrowLeft') goToPrevPage();
  if (e.key === 'ArrowRight') goToNextPage();
  if (e.key === 'f' || e.key === 'F') toggleFullscreen();
});

// Expose for debugging
window._comicReader = () => comicReader; 