// import JSZip from '../lib/jszip.min.js';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];

// --- Add supported archive extensions ---
const ARCHIVE_EXTENSIONS = ['cbz', 'zip', 'cbr', 'rar', 'cb7', '7z'];

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
  
  const ext = file.name.toLowerCase().split('.').pop();
  if (!ARCHIVE_EXTENSIONS.includes(ext)) {
    throw new Error('Only CBZ/ZIP, CBR/RAR, and CB7/7z files are supported.');
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

// --- Add RAR/CBR extraction using unrar.js ---
async function processRar(file, progressCallback) {
  if (!window.UNRAR) {
    throw new Error('unrar.js library not loaded.');
  }
  progressCallback(10, 'Reading RAR/CBR archive...');
  const arrayBuffer = await file.arrayBuffer();
  const extractor = await window.UNRAR.createExtractorFromData({ data: new Uint8Array(arrayBuffer) });
  const { files } = extractor.extract({ password: undefined });
  const imageFiles = files.filter(f => f.fileData && IMAGE_EXTENSIONS.some(ext => f.fileName.toLowerCase().endsWith(ext)));
  if (!imageFiles.length) throw new Error('No images found in archive.');
  imageFiles.sort((a, b) => naturalSort(a.fileName, b.fileName));
  const images = imageFiles.map(f => URL.createObjectURL(new Blob([f.fileData])));
  progressCallback(100, 'Done');
  return images;
}

// --- Add 7z/CB7 extraction using 7z-wasm ---
async function process7z(file, progressCallback) {
  if (!window.JS7z) {
    throw new Error('7z-wasm library not loaded.');
  }
  progressCallback(10, 'Reading 7z/CB7 archive...');
  const arrayBuffer = await file.arrayBuffer();
  const js7z = await window.JS7z();
  // Write file to FS
  js7z.FS.writeFile('/archive.7z', new Uint8Array(arrayBuffer));
  // Extract all
  await new Promise((resolve, reject) => {
    js7z.onExit = (code) => code === 0 ? resolve() : reject(new Error('7z extraction failed'));
    js7z.callMain(['x', '/archive.7z', '-o/out']);
  });
  // List files in /out
  const files = js7z.FS.readdir('/out').filter(name => IMAGE_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext)));
  if (!files.length) throw new Error('No images found in archive.');
  files.sort(naturalSort);
  const images = files.map(name => {
    const data = js7z.FS.readFile('/out/' + name);
    return URL.createObjectURL(new Blob([data]));
  });
  progressCallback(100, 'Done');
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
    validateFile(file);
    progressCallback(5, 'Reading archive...');
    const ext = file.name.toLowerCase().split('.').pop();
    let images = [];
    if (ext === 'cb7' || ext === '7z') {
      // Use 7z-wasm for 7z/CB7
      if (!window.JS7z) throw new Error('7z-wasm library not loaded.');
      const arrayBuffer = await file.arrayBuffer();
      const js7z = await window.JS7z();
      js7z.FS.writeFile('/archive.7z', new Uint8Array(arrayBuffer));
      await new Promise((resolve, reject) => {
        js7z.onExit = (code) => code === 0 ? resolve() : reject(new Error('7z extraction failed'));
        js7z.callMain(['x', '/archive.7z', '-o/out']);
      });
      const files = js7z.FS.readdir('/out').filter(name => IMAGE_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext)));
      if (!files.length) throw new Error('No images found in archive.');
      files.sort(naturalSort);
      for (let i = 0; i < files.length; i++) {
        progressCallback(10 + Math.floor(80 * (i / files.length)), `Extracting page ${i + 1}/${files.length}...`);
        const data = js7z.FS.readFile('/out/' + files[i]);
        images.push(URL.createObjectURL(new Blob([data])));
      }
    } else {
      // Use unarchiver.js for everything else
      if (typeof Unarchiver === 'undefined') throw new Error('unarchiver.js library not loaded.');
      const archive = await Unarchiver.open(file);
      const imageEntries = archive.entries.filter(entry => entry.is_file && IMAGE_EXTENSIONS.some(ext => entry.name.toLowerCase().endsWith(ext)));
      if (!imageEntries.length) throw new Error('No images found in archive.');
      imageEntries.sort((a, b) => naturalSort(a.name, b.name));
      for (let i = 0; i < imageEntries.length; i++) {
        progressCallback(10 + Math.floor(80 * (i / imageEntries.length)), `Extracting page ${i + 1}/${imageEntries.length}...`);
        try {
          const fileObj = await imageEntries[i].read();
          images.push(URL.createObjectURL(fileObj));
        } catch (error) {
          console.warn(`Failed to extract ${imageEntries[i].name}:`, error);
        }
      }
    }
    if (!images.length) throw new Error('No valid images could be extracted from the archive.');
    progressCallback(100, 'Done');
    return { images };
  } catch (error) {
    if (error.images) {
      error.images.forEach(url => URL.revokeObjectURL(url));
    }
    throw error;
  }
}

// Expose functions globally
window.naturalSort = naturalSort;
window.handleFileInput = handleFileInput; 