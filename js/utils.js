// Natural sort for filenames (e.g., page1, page2, page10)
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
window.naturalSort = naturalSort; 