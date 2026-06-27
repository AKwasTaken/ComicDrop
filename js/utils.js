function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

window.naturalSort = naturalSort;

window.utils = window.utils || {
  hideProgress: () => {
    const container = document.getElementById('progressContainer');
    if (container) container.style.display = 'none';
  },
  showProgress: (percent, msg) => {
    const container = document.getElementById('progressContainer');
    const bar = document.getElementById('progressBar');
    const text = document.getElementById('progressText');
    
    if (container) container.style.display = 'flex';
    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `[${percent}%] ${msg}`;
  },
  showError: (msg) => {
    const errContainer = document.getElementById('errorContainer');
    if (errContainer) {
      errContainer.textContent = msg;
      errContainer.style.display = 'block';
    } else {
      alert(msg);
    }
  }
};