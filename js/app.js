import { handleFileInput, handleDrop } from './fileHandler.js';
import { ComicReader } from './reader.js';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const errorContainer = document.getElementById('errorContainer');
const readerContainer = document.getElementById('readerContainer');

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
    const result = await handleFileInput(file, showProgress);
    if (result && result.images && result.images.length) {
      comicReader = new ComicReader(result.images);
      showReader();
      comicReader.displayPage(0);
    } else {
      showError('No images found in archive.');
    }
  } catch (err) {
    showError(err.message || 'Failed to open file.');
  } finally {
    hideProgress();
  }
}

// Navigation controls (to be implemented in Phase 2)
// ...

// Expose for debugging
window._comicReader = () => comicReader; 