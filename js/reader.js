/**
 * ComicReader manages comic page display and navigation.
 */
class ComicReader {
  /**
   * @param {string[]} images - Array of image blob URLs
   */
  constructor(images) {
    this.images = images;
    this.currentPage = 0;
    this.pageContainer = document.getElementById('comicPage');
    // Remove pageCounter reference since it's managed by app.js
  }

  /**
   * Display the page at the given index
   * @param {number} index
   */
  displayPage(index) {
    if (index < 0 || index >= this.images.length) return;
    this.currentPage = index;
    
    if (this.pageContainer) {
      this.pageContainer.innerHTML = '';
      const img = document.createElement('img');
      img.src = this.images[index];
      img.alt = `Page ${index + 1}`;
      this.pageContainer.appendChild(img);
    }
    
    // Page counter update is now handled by app.js updateNavButtons()
  }
}
window.ComicReader = ComicReader; 