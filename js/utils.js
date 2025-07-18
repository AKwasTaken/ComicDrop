/**
 * Natural sort for filenames (e.g., page1, page2, page10)
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
} 