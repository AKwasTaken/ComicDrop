/**
 * ComicReader manages comic page display and navigation.
 */
class ComicReader {
  /**
   * @param {string[]} images - Array of image blob URLs
   * @param {Object} [options] - Optional settings
   * @param {boolean} [options.spreadMode] - If true, show two pages at a time (except first page)
   */
  constructor(images, options = {}) {
    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('Invalid images array provided to ComicReader');
    }
    this.images = images;
    this.currentPage = 0;
    this.pageContainer = document.getElementById('comicPage');
    if (!this.pageContainer) {
      throw new Error('Comic page container not found');
    }
    this.spreadMode = !!options.spreadMode;
    // Preload next image for better performance
    this.preloadQueue = new Set();
    this.preloadNextImage();
  }

  setSpreadMode(enabled) {
    this.spreadMode = !!enabled;
    // Re-render current page(s)
    this.displayPage(this.currentPage);
  }

  isSpreadMode() {
    return !!this.spreadMode;
  }

  /**
   * Preload the next image for smoother navigation
   */
  preloadNextImage() {
    let nextIndex = this.currentPage + 1;
    if (this.spreadMode && this.currentPage === 0) {
      nextIndex = 1;
    } else if (this.spreadMode) {
      nextIndex = this.currentPage + 2;
    }
    if (nextIndex < this.images.length && !this.preloadQueue.has(nextIndex)) {
      const img = new Image();
      img.src = this.images[nextIndex];
      this.preloadQueue.add(nextIndex);
    }
  }

  /**
   * Clean up blob URLs to prevent memory leaks
   */
  cleanup() {
    this.images.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.images = [];
    this.preloadQueue.clear();
  }

  /**
   * Display the page at the given index (handles spread mode)
   * @param {number} index
   */
  displayPage(index) {
    if (index < 0 || index >= this.images.length) {
      console.warn(`Invalid page index: ${index}. Valid range: 0-${this.images.length - 1}`);
      return;
    }
    this.currentPage = index;
    if (this.pageContainer) {
      this.pageContainer.innerHTML = '';
      if (!this.spreadMode || index === 0) {
        // Single page (first page or single mode)
        const img = document.createElement('img');
        img.src = this.images[index];
        img.alt = `Page ${index + 1}`;
        img.loading = 'eager';
        img.onerror = () => {
          console.error(`Failed to load image at index ${index}`);
          img.alt = `Failed to load page ${index + 1}`;
        };
        img.onload = () => {
          this.preloadNextImage();
        };
        this.pageContainer.appendChild(img);
      } else {
        // Spread mode: show two pages (index, index+1)
        const img1 = document.createElement('img');
        img1.src = this.images[index];
        img1.alt = `Page ${index + 1}`;
        img1.loading = 'eager';
        img1.onerror = () => {
          console.error(`Failed to load image at index ${index}`);
          img1.alt = `Failed to load page ${index + 1}`;
        };
        this.pageContainer.appendChild(img1);
        if (index + 1 < this.images.length) {
          const img2 = document.createElement('img');
          img2.src = this.images[index + 1];
          img2.alt = `Page ${index + 2}`;
          img2.loading = 'eager';
          img2.onerror = () => {
            console.error(`Failed to load image at index ${index + 1}`);
            img2.alt = `Failed to load page ${index + 2}`;
          };
          this.pageContainer.appendChild(img2);
        }
        // Preload next spread
        this.preloadNextImage();
      }
    }
    // Page counter update is now handled by app.js updateNavButtons()
  }

  /**
   * Get current page info (adjusted for spread mode)
   * @returns {Object}
   */
  getPageInfo() {
    if (!this.spreadMode) {
      return {
        current: this.currentPage + 1,
        total: this.images.length,
        hasNext: this.currentPage < this.images.length - 1,
        hasPrev: this.currentPage > 0
      };
    } else {
      // Spread mode: first page is single, then spreads
      if (this.currentPage === 0) {
        return {
          current: 1,
          total: this.images.length,
          hasNext: this.images.length > 1,
          hasPrev: false
        };
      } else {
        const spreadNum = Math.floor((this.currentPage - 1) / 2) + 2;
        return {
          current: spreadNum,
          total: this.images.length,
          hasNext: this.currentPage + 2 < this.images.length,
          hasPrev: true
        };
      }
    }
  }

  /**
   * Navigate to next page/spread
   * @returns {boolean} Success status
   */
  nextPage() {
    if (!this.spreadMode) {
      if (this.currentPage < this.images.length - 1) {
        this.displayPage(this.currentPage + 1);
        return true;
      }
      return false;
    } else {
      if (this.currentPage === 0 && this.images.length > 1) {
        this.displayPage(1);
        return true;
      } else if (this.currentPage + 2 < this.images.length) {
        this.displayPage(this.currentPage + 2);
        return true;
      } else if (this.currentPage + 1 < this.images.length) {
        // Last spread is a single page (odd number of pages)
        this.displayPage(this.currentPage + 1);
        return true;
      }
      return false;
    }
  }

  /**
   * Navigate to previous page/spread
   * @returns {boolean} Success status
   */
  prevPage() {
    if (!this.spreadMode) {
      if (this.currentPage > 0) {
        this.displayPage(this.currentPage - 1);
        return true;
      }
      return false;
    } else {
      if (this.currentPage === 1) {
        this.displayPage(0);
        return true;
      } else if (this.currentPage > 1) {
        this.displayPage(this.currentPage - 2);
        return true;
      }
      return false;
    }
  }

  /**
   * Jump to specific page/spread
   * @param {number} page - 1-based page number
   * @returns {boolean} Success status
   */
  goToPage(page) {
    if (!this.spreadMode) {
      const index = page - 1;
      if (index >= 0 && index < this.images.length) {
        this.displayPage(index);
        return true;
      }
      return false;
    } else {
      if (page === 1) {
        this.displayPage(0);
        return true;
      } else {
        // Spread N: index = 1 + (N-2)*2
        const index = 1 + (page - 2) * 2;
        if (index >= 1 && index < this.images.length) {
          this.displayPage(index);
          return true;
        }
        return false;
      }
    }
  }
}
// Expose globally
window.ComicReader = ComicReader; 