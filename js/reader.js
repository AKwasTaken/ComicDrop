/**
 * ComicReader manages comic page display and navigation.
 */
class ComicReader {
  /**
   * @param {string[]} images - Array of image blob URLs
   */
  constructor(images) {
    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('Invalid images array provided to ComicReader');
    }
    
    this.images = images;
    this.currentPage = 0;
    this.pageContainer = document.getElementById('comicPage');
    
    if (!this.pageContainer) {
      throw new Error('Comic page container not found');
    }
    
    // Preload next image for better performance
    this.preloadQueue = new Set();
    this.preloadNextImage();
  }

  /**
   * Preload the next image for smoother navigation
   */
  preloadNextImage() {
    const nextIndex = this.currentPage + 1;
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
   * Display the page at the given index
   * @param {number} index
   */
  displayPage(index) {
    if (index < 0 || index >= this.images.length) {
      console.warn(`Invalid page index: ${index}. Valid range: 0-${this.images.length - 1}`);
      return;
    }
    
    this.currentPage = index;
    
    if (this.pageContainer) {
      // Clear existing content
      this.pageContainer.innerHTML = '';
      
      // Create and configure image element
      const img = document.createElement('img');
      img.src = this.images[index];
      img.alt = `Page ${index + 1}`;
      img.loading = 'eager'; // Force immediate loading for current page
      
      // Add error handling for image loading
      img.onerror = () => {
        console.error(`Failed to load image at index ${index}`);
        img.alt = `Failed to load page ${index + 1}`;
      };
      
      img.onload = () => {
        // Preload next image after current one loads
        this.preloadNextImage();
      };
      
      this.pageContainer.appendChild(img);
    }
    
    // Page counter update is now handled by app.js updateNavButtons()
  }

  /**
   * Get current page info
   * @returns {Object}
   */
  getPageInfo() {
    return {
      current: this.currentPage + 1,
      total: this.images.length,
      hasNext: this.currentPage < this.images.length - 1,
      hasPrev: this.currentPage > 0
    };
  }

  /**
   * Navigate to next page
   * @returns {boolean} Success status
   */
  nextPage() {
    if (this.currentPage < this.images.length - 1) {
      this.displayPage(this.currentPage + 1);
      return true;
    }
    return false;
  }

  /**
   * Navigate to previous page
   * @returns {boolean} Success status
   */
  prevPage() {
    if (this.currentPage > 0) {
      this.displayPage(this.currentPage - 1);
      return true;
    }
    return false;
  }

  /**
   * Jump to specific page
   * @param {number} page - 1-based page number
   * @returns {boolean} Success status
   */
  goToPage(page) {
    const index = page - 1;
    if (index >= 0 && index < this.images.length) {
      this.displayPage(index);
      return true;
    }
    return false;
  }
}

// Expose globally
window.ComicReader = ComicReader; 