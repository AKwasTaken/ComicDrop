const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
const ARCHIVE_EXTENSIONS = ['cbz', 'zip', 'cbr', 'rar', 'cb7', '7z'];

function validateFile(file) {
  if (!file || !file.name) throw new Error('No file selected.');
  const ext = file.name.toLowerCase().split('.').pop();
  if (!ARCHIVE_EXTENSIONS.includes(ext)) {
    throw new Error('Only CBZ/ZIP, CBR/RAR, and CB7/7z files are supported.');
  }
  if (file.size > 1024 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 1GB.');
  }
}

async function handleFileInput(file, progressCallback) {
  validateFile(file);
  progressCallback(5, 'Parsing archive structure...');
  const ext = file.name.toLowerCase().split('.').pop();

  // 7z / CB7 Handling via WASM Filesystem Mapping
  if (ext === 'cb7' || ext === '7z') {
    if (!window.JS7z) throw new Error('7z-wasm library not loaded.');
    const arrayBuffer = await file.arrayBuffer();
    const js7z = await window.JS7z();
    
    js7z.FS.writeFile('/archive.7z', new Uint8Array(arrayBuffer));
    await new Promise((resolve, reject) => {
      js7z.onExit = (code) => code === 0 ? resolve() : reject(new Error('7z extraction failed'));
      js7z.callMain(['x', '/archive.7z', '-o/out']);
    });

    const files = js7z.FS.readdir('/out')
      .filter(name => IMAGE_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext)));
    
    if (!files.length) throw new Error('No images found in 7z archive.');
    files.sort(window.naturalSort);

    // Instead of instantiating all raw blobs immediately, map execution contexts
    const imageMetaEntries = files.map(name => {
      return {
        name: name,
        extract: () => {
          const data = js7z.FS.readFile('/out/' + name);
          return new Blob([data]);
        }
      };
    });
    
    progressCallback(100, 'Done');
    return { entries: imageMetaEntries };
  } 

  // Standard ZIP/RAR Handling via Unarchiver Suite
  if (typeof Unarchiver === 'undefined') throw new Error('unarchiver.js library not loaded.');
  const archive = await Unarchiver.open(file);
  const imageEntries = archive.entries.filter(entry => entry.is_file && IMAGE_EXTENSIONS.some(ext => entry.name.toLowerCase().endsWith(ext)));
  
  if (!imageEntries.length) throw new Error('No images found in archive.');
  imageEntries.sort((a, b) => window.naturalSort(a.name, b.name));

  const entriesMap = imageEntries.map(entry => {
    return {
      name: entry.name,
      extract: async () => {
        return await entry.read(); // Native lazy extraction handle
      }
    };
  });

  progressCallback(100, 'Done');
  return { entries: entriesMap };
}

window.handleFileInput = handleFileInput;
window.fileHandler = {
  async processFile(file) {
    return window.handleFileInput(file, () => {});
  }
};