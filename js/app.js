document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  const state = {
    comicReader: null,
    isEditingPage: false,
  };

  const elements = {
    dropZone: document.getElementById("dropZone"),
    readerContainer: document.getElementById("readerContainer"),
    navControls: document.getElementById("navControls"),
    fileInput: document.getElementById("fileInput"),
    leftArrow: document.getElementById("edgeLeftArrow"),
    rightArrow: document.getElementById("edgeRightArrow"),
    fullscreenBtn: document.getElementById("fullscreenBtn"),
    hideOverlayBtn: document.getElementById("hideOverlayBtn"),
    systemControls: document.getElementById("systemControls")
  };

  let touchStartX = 0;
  let touchEndX = 0;
  const swipeThreshold = 60;

  if (elements.readerContainer) {
    elements.readerContainer.addEventListener('touchstart', (e) => {
      const activeImg = elements.readerContainer.querySelector('.canvas-layer.active');
      if (activeImg && activeImg._zoomScale > 1.05) return;
      
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    elements.readerContainer.addEventListener('touchend', (e) => {
      const activeImg = elements.readerContainer.querySelector('.canvas-layer.active');
      if (activeImg && activeImg._zoomScale > 1.05) return;

      touchEndX = e.changedTouches[0].screenX;
      handleSwipeGesture();
    }, { passive: true });
  }

  function handleSwipeGesture() {
    const deltaX = touchEndX - touchStartX;
    if (deltaX < -swipeThreshold) navigation.goToNextPage();
    if (deltaX > swipeThreshold) navigation.goToPrevPage();
  }

  window.ui = {
    showReader() {
      document.body.classList.add("comic-active");

      const landingPage = document.getElementById("landingPage");
      if (landingPage) landingPage.style.display = "none";

      const topHeading = document.querySelector(".top-heading");
      if (topHeading) topHeading.style.display = "none";

      if (elements.readerContainer)
        elements.readerContainer.style.display = "flex";

      if (elements.leftArrow) elements.leftArrow.style.display = "block";
      if (elements.rightArrow) elements.rightArrow.style.display = "block";
      
      if (elements.systemControls) 
        elements.systemControls.style.display = "inline-flex";

      this.renderNavControls();
    },

    resetUI() {
      document.body.classList.remove("comic-active");

      if (elements.navControls)
        elements.navControls.classList.remove("nav-hidden");
      if (elements.systemControls)
        elements.systemControls.classList.remove("nav-hidden");

      const landingPage = document.getElementById("landingPage");
      if (landingPage) landingPage.style.display = "flex";

      const topHeading = document.querySelector(".top-heading");
      if (topHeading) topHeading.style.display = "block";

      if (elements.readerContainer)
        elements.readerContainer.style.display = "none";
      if (elements.leftArrow) elements.leftArrow.style.display = "none";
      if (elements.rightArrow) elements.rightArrow.style.display = "none";
      
      if (elements.systemControls)
        elements.systemControls.style.display = "none";

      if (window.utils) window.utils.hideProgress();
    },

    renderNavControls() {
      if (!elements.navControls) return;
      
      elements.navControls.innerHTML = `
        <button id="firstPageBtn" title="First Page">
          <img src="assets/icons/first.svg" alt="First Page" width="18" height="18" style="pointer-events: none;" />
        </button>
        <button id="prevPageBtn" title="Previous Page">
          <img src="assets/icons/prev.svg" alt="Previous Page" width="18" height="18" style="pointer-events: none;" />
        </button>
        <span id="pageCounter" title="Click to edit page number">1 / 1</span>
        <button id="nextPageBtn" title="Next Page">
          <img src="assets/icons/next.svg" alt="Next Page" width="18" height="18" style="pointer-events: none;" />
        </button>
        <button id="lastPageBtn" title="Last Page">
          <img src="assets/icons/last.svg" alt="Last Page" width="18" height="18" style="pointer-events: none;" />
        </button>
      `;
      this.attachNavListeners();
    },

    attachNavListeners() {
      const targets = {
        firstPageBtn: document.getElementById("firstPageBtn"),
        prevPageBtn: document.getElementById("prevPageBtn"),
        pageCounter: document.getElementById("pageCounter"),
        nextPageBtn: document.getElementById("nextPageBtn"),
        lastPageBtn: document.getElementById("lastPageBtn"),
      };

      if (targets.firstPageBtn) targets.firstPageBtn.onclick = () => navigation.goToFirstPage();
      if (targets.prevPageBtn) targets.prevPageBtn.onclick = () => navigation.goToPrevPage();
      if (targets.pageCounter) targets.pageCounter.onclick = () => this.startPageEdit();
      if (targets.nextPageBtn) targets.nextPageBtn.onclick = () => navigation.goToNextPage();
      if (targets.lastPageBtn) targets.lastPageBtn.onclick = () => navigation.goToLastPage();

      this.updateNavButtons();
    },

    updateNavButtons() {
      if (!state.comicReader) return;
      const buttons = {
        firstPageBtn: document.getElementById("firstPageBtn"),
        prevPageBtn: document.getElementById("prevPageBtn"),
        pageCounter: document.getElementById("pageCounter"),
        nextPageBtn: document.getElementById("nextPageBtn"),
        lastPageBtn: document.getElementById("lastPageBtn"),
      };

      if (!buttons.firstPageBtn || !buttons.lastPageBtn || !buttons.pageCounter) return;

      const pageInfo = state.comicReader.getPageInfo();

      buttons.firstPageBtn.disabled = !pageInfo.hasPrev;
      if (buttons.prevPageBtn) buttons.prevPageBtn.disabled = !pageInfo.hasPrev;

      buttons.lastPageBtn.disabled = !pageInfo.hasNext;
      if (buttons.nextPageBtn) buttons.nextPageBtn.disabled = !pageInfo.hasNext;

      if (!state.isEditingPage) {
        buttons.pageCounter.textContent = `${pageInfo.current} / ${pageInfo.total}`;
      }
    },

    startPageEdit() {
      if (!state.comicReader) return;
      const pageCounter = document.getElementById("pageCounter");
      if (!pageCounter) return;

      const currentPage = state.comicReader.currentPage + 1;
      const totalPages = state.comicReader.entries.length;

      state.isEditingPage = true;
      const input = document.createElement("input");
      input.type = "number";
      input.min = 1;
      input.max = totalPages;
      input.value = currentPage;
      input.className = "page-edit-input";

      pageCounter.innerHTML = "";
      pageCounter.appendChild(input);
      pageCounter.appendChild(document.createTextNode(` / ${totalPages}`));
      input.focus();
      input.select();

      const commit = () => {
        const val = parseInt(input.value);
        if (val >= 1 && val <= totalPages) {
          state.comicReader.displayPage(val - 1);
        }
        state.isEditingPage = false;
        this.updateNavButtons();
      };

      input.onblur = commit;
      input.onkeydown = (e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          state.isEditingPage = false;
          this.updateNavButtons();
        }
      };
    },
  };

  const navigation = {
    goToFirstPage() { if (state.comicReader) state.comicReader.displayPage(0); },
    goToLastPage() { if (state.comicReader) state.comicReader.displayPage(state.comicReader.entries.length - 1); },
    goToPrevPage() { if (state.comicReader) state.comicReader.prevPage(); },
    goToNextPage() { if (state.comicReader) state.comicReader.nextPage(); },
  };

  window.setupZoomHandlers = function (img, shouldReset) {
    if (shouldReset || img._zoomScale === undefined) {
      img._zoomScale = 1.0;
      img._panOffset = { x: 0, y: 0 };
      img.style.transform = `translate(0px, 0px) scale(1)`;
      img.style.cursor = 'grab';
    }

    if (img._zoomListenersAttached) return;
    img._zoomListenersAttached = true;

    img.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 10) {
        img._zoomScale += e.deltaY * -0.01;
      } else {
        img._zoomScale *= e.deltaY > 0 ? 0.95 : 1.05;
      }
      img._zoomScale = Math.max(1.0, Math.min(6.0, img._zoomScale));
      img.style.transform = `translate(${img._panOffset.x}px, ${img._panOffset.y}px) scale(${img._zoomScale})`;
    }, { passive: false });

    let dragging = false;
    let start = { x: 0, y: 0 };
    
    img.addEventListener("mousedown", (e) => {
      if (img._zoomScale > 1.05) {
        dragging = true;
        start = { x: e.clientX - img._panOffset.x, y: e.clientY - img._panOffset.y };
        img.style.cursor = "grabbing";
        e.preventDefault();
      }
    });

    // Event loops shifted natively onto the explicit element space rather than the window pipeline
    img.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      img._panOffset.x = e.clientX - start.x;
      img._panOffset.y = e.clientY - start.y;
      img.style.transform = `translate(${img._panOffset.x}px, ${img._panOffset.y}px) scale(${img._zoomScale})`;
    });

    img.addEventListener("mouseup", () => {
      dragging = false;
      if (img) img.style.cursor = img._zoomScale > 1.05 ? "grab" : "default";
    });

    let lastTap = 0;
    const handleResetAction = (e) => {
      e.stopPropagation();
      img._zoomScale = 1.0;
      img._panOffset = { x: 0, y: 0 };
      img.style.transform = `translate(0px, 0px) scale(1)`;
      img.style.cursor = "grab";
    };

    img.addEventListener("dblclick", handleResetAction);

    img.addEventListener("touchend", (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      lastTap = currentTime;
      if (tapLength < 300 && tapLength > 0) handleResetAction(e);
    });
  };

  async function loadLibraryDependency(ext) {
    if ((ext === "cb7" || ext === "7z") && !window.JS7z) {
      window.Module = window.Module || {};
      window.Module.locateFile = (path) => path.endsWith(".wasm") ? "lib/7zz.wasm" : path;
      return new Promise((res, rej) => {
        const scr = document.createElement("script");
        scr.src = "lib/7zz.umd.js";
        scr.onload = res;
        scr.onerror = rej;
        document.head.appendChild(scr);
      });
    }
  }

  async function routeArchiveProcessing(file) {
    const ext = file.name.toLowerCase().split(".").pop();
    window.ui.resetUI();
    try {
      if (window.utils) window.utils.showProgress(10, "Loading core systems...");
      await loadLibraryDependency(ext);

      const targetStructure = await window.handleFileInput(file, window.utils ? window.utils.showProgress : () => {});
      if (targetStructure && targetStructure.entries && targetStructure.entries.length) {
        if (state.comicReader) state.comicReader.cleanup();
        state.comicReader = new window.ComicReader(targetStructure.entries);
        window.ui.showReader();
        await state.comicReader.displayPage(0);
      }
    } catch (err) {
      if (window.utils) window.utils.showError(err.message || "Error processing comic book file.");
    }
  }

  if (elements.hideOverlayBtn) {
    elements.hideOverlayBtn.onclick = (e) => {
      e.stopPropagation();
      if (elements.navControls) elements.navControls.classList.add("nav-hidden");
      if (elements.systemControls) elements.systemControls.classList.add("nav-hidden");
    };
  }

  if (elements.fullscreenBtn) {
    elements.fullscreenBtn.onclick = (e) => {
      e.stopPropagation();
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    };
  }

  window.addEventListener("click", (e) => {
    if (!state.comicReader) return;
    if (e.target.closest('#navControls') || e.target.closest('#systemControls')) return;

    const isHidden = elements.navControls && elements.navControls.classList.contains("nav-hidden");
    if (isHidden) {
      if (elements.navControls) elements.navControls.classList.remove("nav-hidden");
      if (elements.systemControls) elements.systemControls.classList.remove("nav-hidden");
    }
  });

  if (elements.leftArrow) elements.leftArrow.onclick = () => navigation.goToPrevPage();
  if (elements.rightArrow) elements.rightArrow.onclick = () => navigation.goToNextPage();

  if (elements.dropZone) {
    elements.dropZone.ondragover = (e) => { e.preventDefault(); elements.dropZone.classList.add("dragover"); };
    elements.dropZone.ondragleave = () => elements.dropZone.classList.remove("dragover");
    elements.dropZone.ondrop = (e) => {
      e.preventDefault();
      elements.dropZone.classList.remove("dragover");
      if (e.dataTransfer.files.length) routeArchiveProcessing(e.dataTransfer.files[0]);
    };
    elements.dropZone.onclick = (e) => {
      if (e.target === elements.dropZone && elements.fileInput) elements.fileInput.click();
    };
  }

  if (elements.fileInput) {
    elements.fileInput.onchange = () => {
      if (elements.fileInput.files && elements.fileInput.files.length)
        routeArchiveProcessing(elements.fileInput.files[0]);
    };
  }

  document.onkeydown = (e) => {
    if (!state.comicReader) return;
    if (e.key === "ArrowLeft") navigation.goToPrevPage();
    if (e.key === "ArrowRight") navigation.goToNextPage();
    if (e.key === "Home") navigation.goToFirstPage();
    if (e.key === "End") navigation.goToLastPage();
  };
}