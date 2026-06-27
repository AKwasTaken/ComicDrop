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
    systemControls: document.getElementById("systemControls"),
  };

  let touchStartX = 0;
  let touchEndX = 0;
  const swipeThreshold = 60;

  if (elements.readerContainer) {
    elements.readerContainer.addEventListener(
      "touchstart",
      (e) => {
        const activeImg = elements.readerContainer.querySelector(
          ".canvas-layer.active",
        );
        if (activeImg && activeImg._zoomScale > 1.05) return;

        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true },
    );

    elements.readerContainer.addEventListener(
      "touchend",
      (e) => {
        const activeImg = elements.readerContainer.querySelector(
          ".canvas-layer.active",
        );
        if (activeImg && activeImg._zoomScale > 1.05) return;

        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
      },
      { passive: true },
    );
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

      // Inline SVGs sanitized with universal scaling rules
      elements.navControls.innerHTML = `
        <button id="firstPageBtn" title="First Page">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 752.3 698.05" style="fill: currentColor;"><g><path d="M449.15,349.04L741.45,63.09c6.43-6.83,10.85-16.48,10.85-26.12,0-20.9-16.07-36.97-36.97-36.97-10.05,0-18.89,4.02-26.12,10.85l-318.28,311.45c-7.64,6.43-12.06,16.48-12.06,26.92s4.42,19.29,12.06,26.93l318.28,311.05c6.83,6.83,16.08,10.85,26.12,10.85,20.9,0,36.97-15.67,36.97-36.57,0-10.05-4.42-19.29-10.85-26.12l-292.3-286.32Z"/><path d="M89.91,349.04L382.58,63.09c6.43-6.83,10.45-16.48,10.45-26.12,0-20.9-15.67-36.97-36.57-36.97-10.45,0-19.29,4.02-26.12,10.85L12.06,322.3c-7.64,6.43-12.06,16.48-12.06,26.92s4.02,19.29,11.65,26.93l318.68,311.05c6.83,6.83,15.67,10.85,26.12,10.85,20.9,0,36.57-15.67,36.57-36.57,0-10.05-4.02-19.29-10.45-26.12L89.91,349.04Z"/></g></svg>
        </button>
        <button id="prevPageBtn" title="Previous Page">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 393.03 697.64" style="fill: currentColor;"><g><path d="M0,348.82c0,10.05,3.62,18.89,11.25,26.52l318.68,311.45c6.83,7.23,15.67,10.85,26.12,10.85,20.9,0,36.97-15.67,36.97-36.57,0-10.45-4.42-19.29-10.85-26.12L89.62,348.82,382.18,62.69c6.43-6.83,10.85-16.07,10.85-26.12,0-20.9-16.07-36.57-36.97-36.57-10.45,0-19.29,3.62-26.12,10.45L11.25,322.3c-7.64,7.23-11.25,16.48-11.25,26.52Z"/></g></svg>
        </button>
        <span id="pageCounter" title="Click to edit page number">1 / 1</span>
        <button id="nextPageBtn" title="Next Page">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 393.48 698.45" style="fill: currentColor;"><g><path d="M393.48,349.22c0-10.06-4.02-19.31-11.67-26.55L63.17,10.46C55.92,3.62,47.07,0,36.61,0,16.09,0,0,15.69,0,36.61c0,10.06,4.02,19.31,10.46,26.15l292.9,286.46L10.46,635.68c-6.44,6.84-10.46,15.69-10.46,26.15,0,20.92,16.09,36.61,36.61,36.61,10.46,0,19.31-3.62,26.55-10.86l318.65-311.81c7.64-7.64,11.67-16.5,11.67-26.55Z"/></g></svg>
        </button>
        <button id="lastPageBtn" title="Last Page">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 753.16 698.85" style="fill: currentColor;"><g><path d="M741.09,322.67L422.45,10.86c-7.24-6.84-15.69-10.86-26.15-10.86-20.92,0-37.01,16.09-37.01,37.01,0,9.66,4.43,19.31,10.86,26.15l292.63,286.27-292.63,286.65c-6.44,6.84-10.46,16.09-10.46,26.15,0,20.92,16.09,36.61,37.01,36.61,10.46,0,19.31-4.02,26.15-10.86l318.65-311.4c7.64-7.64,12.07-16.9,12.07-26.96s-4.43-20.52-12.07-26.96Z"/><path d="M393.48,349.63c0-10.46-4.02-20.52-11.67-26.96L62.76,10.86C55.92,4.02,47.07,0,36.61,0,15.69,0,0,16.09,0,37.01c0,9.66,4.02,19.31,10.46,26.15l293.01,286.27L10.46,636.09c-6.44,6.84-10.46,16.09-10.46,26.15,0,20.92,15.69,36.61,36.61,36.61,10.46,0,19.31-4.02,26.55-10.86l318.65-311.4c7.64-7.64,11.67-16.9,11.67-26.96Z"/></g></svg>
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

      if (targets.firstPageBtn)
        targets.firstPageBtn.onclick = () => navigation.goToFirstPage();
      if (targets.prevPageBtn)
        targets.prevPageBtn.onclick = () => navigation.goToPrevPage();
      if (targets.pageCounter)
        targets.pageCounter.onclick = () => this.startPageEdit();
      if (targets.nextPageBtn)
        targets.nextPageBtn.onclick = () => navigation.goToNextPage();
      if (targets.lastPageBtn)
        targets.lastPageBtn.onclick = () => navigation.goToLastPage();

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

      if (!buttons.firstPageBtn || !buttons.lastPageBtn || !buttons.pageCounter)
        return;

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
    goToFirstPage() {
      if (state.comicReader) state.comicReader.displayPage(0);
    },
    goToLastPage() {
      if (state.comicReader)
        state.comicReader.displayPage(state.comicReader.entries.length - 1);
    },
    goToPrevPage() {
      if (state.comicReader) state.comicReader.prevPage();
    },
    goToNextPage() {
      if (state.comicReader) state.comicReader.nextPage();
    },
  };

  window.setupZoomHandlers = function (img, shouldReset) {
    if (shouldReset || img._zoomScale === undefined) {
      img._zoomScale = 1.0;
      img._panOffset = { x: 0, y: 0 };
      img.style.transform = `translate(0px, 0px) scale(1)`;
      img.style.cursor = "grab";
    }

    if (img._zoomListenersAttached) return;
    img._zoomListenersAttached = true;

    img.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        if (Math.abs(e.deltaY) < 10) {
          img._zoomScale += e.deltaY * -0.01;
        } else {
          img._zoomScale *= e.deltaY > 0 ? 0.95 : 1.05;
        }
        img._zoomScale = Math.max(1.0, Math.min(6.0, img._zoomScale));
        img.style.transform = `translate(${img._panOffset.x}px, ${img._panOffset.y}px) scale(${img._zoomScale})`;
      },
      { passive: false },
    );

    let dragging = false;
    let start = { x: 0, y: 0 };

    img.addEventListener("mousedown", (e) => {
      if (img._zoomScale > 1.05) {
        dragging = true;
        start = {
          x: e.clientX - img._panOffset.x,
          y: e.clientY - img._panOffset.y,
        };
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
      window.Module.locateFile = (path) =>
        path.endsWith(".wasm") ? "lib/7zz.wasm" : path;
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
      if (window.utils)
        window.utils.showProgress(10, "Loading core systems...");
      await loadLibraryDependency(ext);

      const targetStructure = await window.handleFileInput(
        file,
        window.utils ? window.utils.showProgress : () => {},
      );
      if (
        targetStructure &&
        targetStructure.entries &&
        targetStructure.entries.length
      ) {
        if (state.comicReader) state.comicReader.cleanup();
        state.comicReader = new window.ComicReader(targetStructure.entries);
        window.ui.showReader();
        await state.comicReader.displayPage(0);
      }
    } catch (err) {
      if (window.utils)
        window.utils.showError(
          err.message || "Error processing comic book file.",
        );
    }
  }

  if (elements.hideOverlayBtn) {
    elements.hideOverlayBtn.onclick = (e) => {
      e.stopPropagation();
      if (elements.navControls)
        elements.navControls.classList.add("nav-hidden");
      if (elements.systemControls)
        elements.systemControls.classList.add("nav-hidden");
    };
  }

  if (elements.fullscreenBtn) {
    elements.fullscreenBtn.onclick = (e) => {
      e.stopPropagation();
      if (!document.fullscreenElement)
        document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    };
  }

  window.addEventListener("click", (e) => {
    if (!state.comicReader) return;
    if (e.target.closest("#navControls") || e.target.closest("#systemControls"))
      return;

    const isHidden =
      elements.navControls &&
      elements.navControls.classList.contains("nav-hidden");
    if (isHidden) {
      if (elements.navControls)
        elements.navControls.classList.remove("nav-hidden");
      if (elements.systemControls)
        elements.systemControls.classList.remove("nav-hidden");
    }
  });

  if (elements.leftArrow)
    elements.leftArrow.onclick = () => navigation.goToPrevPage();
  if (elements.rightArrow)
    elements.rightArrow.onclick = () => navigation.goToNextPage();

  if (elements.dropZone) {
    elements.dropZone.ondragover = (e) => {
      e.preventDefault();
      elements.dropZone.classList.add("dragover");
    };
    elements.dropZone.ondragleave = () =>
      elements.dropZone.classList.remove("dragover");
    elements.dropZone.ondrop = (e) => {
      e.preventDefault();
      elements.dropZone.classList.remove("dragover");
      if (e.dataTransfer.files.length)
        routeArchiveProcessing(e.dataTransfer.files[0]);
    };
    elements.dropZone.onclick = (e) => {
      if (e.target === elements.dropZone && elements.fileInput)
        elements.fileInput.click();
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
