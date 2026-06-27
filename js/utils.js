// Natural sort for filenames (e.g., page1, page2, page10)
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// Global scope attachment
window.naturalSort = naturalSort;

window.utils = window.utils || {
  hideProgress: () => {
    const p = document.getElementById('progressDisplay');
    if (p) p.style.display = 'none';
  },
  showProgress: (percent, msg) => {
    const p = document.getElementById('progressDisplay');
    if (p) {
      p.style.display = 'block';
      p.innerText = `[${percent}%] ${msg}`;
    }
  },
  showError: (msg) => { alert(msg); },
  resetEditingState: () => {
    window.isEditingPage = false;
  }
};