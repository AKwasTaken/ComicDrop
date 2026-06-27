class ComicReader {
  constructor(entries, options = {}) {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error('Invalid entries configuration provided.');
    }
    this.entries = entries; // Image entry references
    this.blobCache = new Map(); // Dynamic Sliding Cache Window [Index -> BlobURL]
    this.currentPage = 0;
    this.pageContainer = document.getElementById('comicPage');
    this.spreadMode = !!options.spreadMode;
    
    if (!this.pageContainer) throw new Error('Page element container not found.');
  }

  setSpreadMode(enabled) {
    this.spreadMode = !!enabled;
    this.displayPage(this.currentPage);
  }

  async getPageUrl(index) {
    if (index < 0 || index >= this.entries.length) return null;
    if (this.blobCache.has(index)) {
      return this.blobCache.get(index);
    }
    // Lazy on-demand asset loading
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

  /**
   * Sliding Window Garbage Collector
   * Keeps active windows intact, destroys surrounding leaks.
   */
  manageMemoryBuffer(activeIndex) {
    const lookaheadWindow = this.spreadMode ? 3 : 2;
    const historicalWindow = this.spreadMode ? 3 : 1;

    for (const cachedIndex of this.blobCache.keys()) {
      if (cachedIndex < activeIndex - historicalWindow || cachedIndex > activeIndex + lookaheadWindow) {
        URL.revokeObjectURL(this.blobCache.get(cachedIndex));
        this.blobCache.delete(cachedIndex);
      }
    }
  }

  async preloadNextSegments(index) {
    const nextTarget = this.spreadMode ? index + 2 : index + 1;
    if (nextTarget < this.entries.length) {
      await this.getPageUrl(nextTarget); 
    }
  }

  async displayPage(index) {
    if (index < 0 || index >= this.entries.length) return;
    this.currentPage = index;
    this.pageContainer.innerHTML = '';

    this.manageMemoryBuffer(index);

    const renderImage = async (imgIndex, placementTarget) => {
      const srcUrl = await this.getPageUrl(imgIndex);
      if (!srcUrl) return;

      const img = document.createElement('img');
      img.src = srcUrl;
      img.alt = `Page ${imgIndex + 1}`;
      img.loading = 'eager';
      
      img.onload = () => {
        if (typeof window.setupZoomHandlers === 'function') {
          window.setupZoomHandlers(img, true);
        }
        this.preloadNextSegments(imgIndex);
      };

      placementTarget.appendChild(img);
    };

    if (!this.spreadMode || index === 0) {
      await renderImage(index, this.pageContainer);
    } else {
      const spreadWrapper = document.createElement('div');
      spreadWrapper.className = 'spread-view-wrapper';
      spreadWrapper.style.display = 'flex';
      spreadWrapper.style.gap = '10px';
      this.pageContainer.appendChild(spreadWrapper);

      await renderImage(index, spreadWrapper);
      if (index + 1 < this.entries.length) {
        await renderImage(index + 1, spreadWrapper);
      }
    }

    if (window.ui && typeof window.ui.updateNavButtons === 'function') {
      window.ui.updateNavButtons();
    }
  }

  getPageInfo() {
    const total = this.entries.length;
    if (!this.spreadMode) {
      return { current: this.currentPage + 1, total, hasNext: this.currentPage < total - 1, hasPrev: this.currentPage > 0 };
    }
    if (this.currentPage === 0) {
      return { current: 1, total, hasNext: total > 1, hasPrev: false };
    }
    const spreadNum = Math.floor((this.currentPage - 1) / 2) + 2;
    return { current: spreadNum, total, hasNext: this.currentPage + 2 < total, hasPrev: true };
  }

  nextPage() {
    const info = this.getPageInfo();
    if (!info.hasNext) return false;
    const leap = (this.spreadMode && this.currentPage !== 0) ? 2 : 1;
    this.displayPage(this.currentPage + leap);
    return true;
  }

  prevPage() {
    const info = this.getPageInfo();
    if (!info.hasPrev) return false;
    if (this.spreadMode && this.currentPage === 1) {
      this.displayPage(0);
    } else {
      this.displayPage(this.currentPage - (this.spreadMode ? 2 : 1));
    }
    return true;
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