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

/**
 * Validate file type and size
 * @param {File} file
 * @returns {void}
 */
function validateFile(file) {
  if (!file || !file.name) {
    throw new Error('No file selected.');
  }
  
  if (!window.JSZip) {
    throw new Error('JSZip library not loaded. Please ensure jszip.min.js is in the lib/ folder.');
  }
  
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext !== 'cbz' && ext !== 'zip') {
    throw new Error('Only CBZ (ZIP) files are supported in this version.');
  }
  
  // Check file size (optional - can be removed if not needed)
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 500MB.');
  }
}

/**
 * Extract and process images from ZIP archive
 * @param {JSZip} zip
 * @param {function} progressCallback
 * @returns {Promise<string[]>}
 */
async function processImages(zip, progressCallback) {
  const imageFiles = Object.values(zip.files)
    .filter(f => !f.dir && IMAGE_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)));
  
  if (!imageFiles.length) {
    throw new Error('No images found in archive.');
  }
  
  // Natural sort for proper page order
  imageFiles.sort((a, b) => naturalSort(a.name, b.name));
  
  const images = [];
  const totalFiles = imageFiles.length;
  
  for (let i = 0; i < totalFiles; i++) {
    const progress = 10 + Math.floor(80 * (i / totalFiles));
    progressCallback(progress, `Extracting page ${i + 1}/${totalFiles}...`);
    
    try {
      const blob = await imageFiles[i].async('blob');
      const url = URL.createObjectURL(blob);
      images.push(url);
    } catch (error) {
      console.warn(`Failed to extract ${imageFiles[i].name}:`, error);
      // Continue with other files
    }
  }
  
  if (images.length === 0) {
    throw new Error('No valid images could be extracted from the archive.');
  }
  
  return images;
}

/**
 * Handle file input for CBZ (ZIP) files. Returns { images: [Blob URLs] }
 * @param {File} file
 * @param {function} progressCallback
 * @returns {Promise<{images: string[]}>}
 */
async function handleFileInput(file, progressCallback) {
  try {
    // Validate file
    validateFile(file);
    
    progressCallback(5, 'Reading archive...');
    
    // Load ZIP archive
    let zip;
    try {
      zip = await window.JSZip.loadAsync(file);
    } catch (error) {
      console.error('ZIP loading error:', error);
      throw new Error('Failed to read ZIP archive. The file may be corrupted or password-protected.');
    }
    
    // Process images
    const images = await processImages(zip, progressCallback);
    
    progressCallback(100, 'Done');
    
    return { images };
  } catch (error) {
    // Clean up any created blob URLs on error
    if (error.images) {
      error.images.forEach(url => URL.revokeObjectURL(url));
    }
    throw error;
  }
}

// Expose functions globally
window.naturalSort = naturalSort;
window.handleFileInput = handleFileInput; 