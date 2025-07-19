// import JSZip from '../lib/jszip.min.js';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];

/**
 * Natural sort for filenames (e.g., page1, page2, page10)
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
window.naturalSort = naturalSort;

/**
 * Handle file input for CBZ (ZIP) files. Returns { images: [Blob URLs] }
 * @param {File} file
 * @param {function} progressCallback
 * @returns {Promise<{images: string[]}>}
 */
async function handleFileInput(file, progressCallback) {
  if (!file || !file.name) throw new Error('No file selected.');
  if (!window.JSZip) throw new Error('JSZip library not loaded. Please ensure jszip.min.js is in the lib/ folder.');
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext !== 'cbz' && ext !== 'zip') {
    throw new Error('Only CBZ (ZIP) files are supported in this version.');
  }
  progressCallback(10, 'Reading archive...');
  let zip;
  try {
    zip = await window.JSZip.loadAsync(file);
  } catch (e) {
    throw new Error('Failed to read ZIP archive.');
  }
  const imageFiles = Object.values(zip.files)
    .filter(f => !f.dir && IMAGE_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)));
  if (!imageFiles.length) throw new Error('No images found in archive.');
  // Natural sort
  imageFiles.sort((a, b) => window.naturalSort(a.name, b.name));
  const images = [];
  for (let i = 0; i < imageFiles.length; i++) {
    progressCallback(10 + Math.floor(80 * (i / imageFiles.length)), `Extracting page ${i+1}...`);
    const blob = await imageFiles[i].async('blob');
    images.push(URL.createObjectURL(blob));
  }
  progressCallback(100, 'Done');
  return { images };
}
window.handleFileInput = handleFileInput; 