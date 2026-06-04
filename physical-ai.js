(() => {
  const carousels = Array.from(document.querySelectorAll("[data-carousel]"));
  const carouselStates = new Map();

  if (!carousels.length) {
    return;
  }

  carousels.forEach((carousel) => {
    const track = carousel.querySelector("[data-track]");
    const slides = Array.from(carousel.querySelectorAll(".detail-slide"));
    const dots = Array.from(carousel.querySelectorAll("[data-dot]"));
    const prevButton = carousel.querySelector("[data-prev]");
    const nextButton = carousel.querySelector("[data-next]");

    if (!track || !slides.length) {
      return;
    }

    let currentIndex = 0;
    let startX = 0;

    const setSlide = (index) => {
      currentIndex = (index + slides.length) % slides.length;
      track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;
      carousel.dataset.currentIndex = String(currentIndex);

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === currentIndex);
      });

      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === currentIndex);
      });
    };

    const goNext = () => setSlide(currentIndex + 1);
    const goPrev = () => setSlide(currentIndex - 1);
    const goNextWithinBounds = () => {
      if (currentIndex >= slides.length - 1) {
        return false;
      }

      setSlide(currentIndex + 1);
      return true;
    };

    const goPrevWithinBounds = () => {
      if (currentIndex <= 0) {
        return false;
      }

      setSlide(currentIndex - 1);
      return true;
    };

    carouselStates.set(carousel, {
      getCurrentIndex: () => currentIndex,
      getLastIndex: () => slides.length - 1,
      goNextWithinBounds,
      goPrevWithinBounds,
    });

    prevButton?.addEventListener("click", () => {
      goPrev();
    });

    nextButton?.addEventListener("click", () => {
      goNext();
    });

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        setSlide(Number(dot.dataset.dot));
      });
    });

    carousel.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
    });

    carousel.addEventListener("pointerup", (event) => {
      const deltaX = event.clientX - startX;

      if (Math.abs(deltaX) < 60) {
        return;
      }

      if (deltaX < 0) {
        goNext();
      } else {
        goPrev();
      }
    });

    setSlide(0);
  });

  const initDetailWheelLock = () => {
    const scroller = document.querySelector(".detail-page");

    if (!scroller) {
      return;
    }

    const sections = Array.from(scroller.querySelectorAll(".detail-section"));
    const lockMs = 980;
    const threshold = 28;
    const touchThreshold = 52;
    let isLocked = false;
    let wheelDelta = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchLastY = 0;
    let touchMode = null;

    const lockInteraction = () => {
      isLocked = true;

      window.setTimeout(() => {
        isLocked = false;
      }, lockMs);
    };

    const currentSectionIndex = () => {
      const scrollTop = scroller.scrollTop;

      return sections.reduce((closestIndex, section, index) => {
        const closestDistance = Math.abs(sections[closestIndex].offsetTop - scrollTop);
        const sectionDistance = Math.abs(section.offsetTop - scrollTop);
        return sectionDistance < closestDistance ? index : closestIndex;
      }, 0);
    };

    const scrollToSection = (index) => {
      const target = sections[Math.max(0, Math.min(index, sections.length - 1))];

      if (!target) {
        return;
      }

      lockInteraction();
      scroller.scrollTo({
        top: target.offsetTop,
        behavior: "smooth",
      });
    };

    const advanceCarouselIfPossible = (section, direction) => {
      const carousel = section.querySelector("[data-carousel]");
      const state = carouselStates.get(carousel);

      if (!state) {
        return false;
      }

      if (direction > 0 && state.goNextWithinBounds()) {
        return true;
      }

      if (direction < 0 && state.goPrevWithinBounds()) {
        return true;
      }

      return false;
    };

    const stepByDirection = (direction) => {
      const sectionIndex = currentSectionIndex();
      const section = sections[sectionIndex];

      if (section && advanceCarouselIfPossible(section, direction)) {
        lockInteraction();
        return;
      }

      scrollToSection(sectionIndex + direction);
    };

    scroller.addEventListener(
      "wheel",
      (event) => {
        if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
          return;
        }

        event.preventDefault();

        if (isLocked) {
          return;
        }

        wheelDelta += event.deltaY;

        if (Math.abs(wheelDelta) < threshold) {
          return;
        }

        const direction = wheelDelta > 0 ? 1 : -1;
        wheelDelta = 0;

        stepByDirection(direction);
      },
      { passive: false },
    );

    scroller.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length !== 1) {
          touchMode = null;
          return;
        }

        const touch = event.touches[0];

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchLastY = touch.clientY;
        touchMode = null;
      },
      { passive: true },
    );

    scroller.addEventListener(
      "touchmove",
      (event) => {
        if (event.touches.length !== 1) {
          touchMode = null;
          return;
        }

        const touch = event.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        touchLastY = touch.clientY;

        if (!touchMode && Math.max(absX, absY) > 10) {
          touchMode = absY > absX ? "vertical" : "horizontal";
        }

        if (touchMode === "vertical") {
          event.preventDefault();
        }
      },
      { passive: false },
    );

    scroller.addEventListener(
      "touchend",
      (event) => {
        if (touchMode !== "vertical") {
          touchMode = null;
          return;
        }

        event.preventDefault();

        const deltaY = touchLastY - touchStartY;
        touchMode = null;

        if (isLocked || Math.abs(deltaY) < touchThreshold) {
          return;
        }

        stepByDirection(deltaY < 0 ? 1 : -1);
      },
      { passive: false },
    );

    scroller.addEventListener("touchcancel", () => {
      touchMode = null;
    });
  };

  initDetailWheelLock();
})();
