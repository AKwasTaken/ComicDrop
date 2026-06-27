class ComicReader {
  constructor(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error('Invalid entries configuration provided.');
    }
    this.entries = entries; 
    this.blobCache = new Map(); // Sliding Window Cache [Index -> BlobURL]
    this.currentPage = 0;
    this.pageContainer = document.getElementById('comicPage');
    
    if (!this.pageContainer) throw new Error('Page element container not found.');
  }

  async getPageUrl(index) {
    if (index < 0 || index >= this.entries.length) return null;
    if (this.blobCache.has(index)) {
      return this.blobCache.get(index);
    }
    try {
      const fileBlob = await this.entries[index].extract();
      const objectUrl = URL.createObjectURL(fileBlob);
      this.blobCache.set(index, objectUrl);
      return objectUrl;
    } catch (e) {
      console.error(`Decompression error on page index ${index}:`, e);
      return null;
    }
  }

  manageMemoryBuffer(activeIndex) {
    for (const cachedIndex of this.blobCache.keys()) {
      if (cachedIndex < activeIndex - 1 || cachedIndex > activeIndex + 2) {
        URL.revokeObjectURL(this.blobCache.get(cachedIndex));
        this.blobCache.delete(cachedIndex);
      }
    }
  }

  async preloadNextSegments(index) {
    const nextTarget = index + 1;
    if (nextTarget < this.entries.length) {
      await this.getPageUrl(nextTarget); 
    }
  }

  async displayPage(index) {
    if (index < 0 || index >= this.entries.length) return;
    this.currentPage = index;

    this.manageMemoryBuffer(index);

    const canvasA = document.getElementById('pageCanvasA');
    const canvasB = document.getElementById('pageCanvasB');
    if (!canvasA || !canvasB) return;

    const activeCanvas = canvasA.classList.contains('active') ? canvasA : canvasB;
    const hiddenCanvas = activeCanvas === canvasA ? canvasB : canvasA;

    const srcUrl = await this.getPageUrl(index);
    if (!srcUrl) return;

    hiddenCanvas.src = srcUrl;
    hiddenCanvas.alt = `Page ${index + 1}`;

    hiddenCanvas.onload = () => {
      // FIX: Passing true forces the zoom engine to zero out scales/offsets for the incoming page
      if (typeof window.setupZoomHandlers === 'function') {
        window.setupZoomHandlers(hiddenCanvas, true);
      }
      this.preloadNextSegments(index);

      activeCanvas.classList.remove('active');
      activeCanvas.classList.add('hidden');

      hiddenCanvas.classList.remove('hidden');
      hiddenCanvas.classList.add('active');

      if (window.ui && typeof window.ui.updateNavButtons === 'function') {
        window.ui.updateNavButtons();
      }
    };
  }

  getPageInfo() {
    return { 
      current: this.currentPage + 1, 
      total: this.entries.length, 
      hasNext: this.currentPage < this.entries.length - 1, 
      hasPrev: this.currentPage > 0 
    };
  }

  nextPage() {
    if (this.currentPage < this.entries.length - 1) {
      this.displayPage(this.currentPage + 1);
      return true;
    }
    return false;
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.displayPage(this.currentPage - 1);
      return true;
    }
    return false;
  }

  goToPage(pageNumber) {
    const index = pageNumber - 1;
    if (index >= 0 && index < this.entries.length) {
      this.displayPage(index);
      return true;
    }
    return false;
  }

  cleanup() {
    for (const url of this.blobCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.blobCache.clear();
    this.entries = [];
  }
}

window.ComicReader = ComicReader;