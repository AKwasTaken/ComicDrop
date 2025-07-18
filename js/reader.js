/**
 * ComicReader manages comic page display and navigation.
 */
export class ComicReader {
  /**
   * @param {string[]} images - Array of image blob URLs
   */
  constructor(images) {
    this.images = images;
    this.currentPage = 0;
    this.pageContainer = document.getElementById('comicPage');
    this.pageCounter = document.getElementById('pageCounter');
  }

  /**
   * Display the page at the given index
   * @param {number} index
   */
  displayPage(index) {
    if (index < 0 || index >= this.images.length) return;
    this.currentPage = index;
    this.pageContainer.innerHTML = '';
    const img = document.createElement('img');
    img.src = this.images[index];
    img.alt = `Page ${index + 1}`;
    this.pageContainer.appendChild(img);
    this.pageCounter.textContent = `Page ${index + 1} of ${this.images.length}`;
  }
} 