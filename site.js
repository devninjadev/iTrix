(() => {
  const headers = Array.from(document.querySelectorAll(".site-header"));

  headers.forEach((header) => {
    const toggle = header.querySelector("[data-menu-toggle]");
    const nav = header.querySelector("[data-site-nav]");
    const backdrop = header.querySelector("[data-menu-backdrop]");

    if (!toggle || !nav) {
      return;
    }

    const isMobile = () => window.innerWidth <= 900;

    const setOpen = (isOpen) => {
      const shouldOpen = isOpen && isMobile();

      header.classList.toggle("is-menu-open", shouldOpen);
      toggle.setAttribute("aria-expanded", String(shouldOpen));
      toggle.setAttribute("aria-label", shouldOpen ? "메뉴 닫기" : "메뉴 열기");

      if (isMobile()) {
        nav.setAttribute("aria-hidden", String(!shouldOpen));
        nav.inert = !shouldOpen;
      } else {
        nav.removeAttribute("aria-hidden");
        nav.inert = false;
      }
    };

    toggle.addEventListener("click", () => {
      setOpen(!header.classList.contains("is-menu-open"));
    });

    backdrop?.addEventListener("click", () => setOpen(false));

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    });

    window.addEventListener("resize", () => {
      setOpen(false);
    });

    setOpen(false);
  });

  const initSectionWheelLock = () => {
    const scroller = document.querySelector(".main-container");

    if (!scroller) {
      return;
    }

    const sections = Array.from(scroller.querySelectorAll(".panel"));
    const lockMs = 950;
    const threshold = 28;
    let isLocked = false;
    let wheelDelta = 0;

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

      isLocked = true;
      scroller.scrollTo({
        top: target.offsetTop,
        behavior: "smooth",
      });

      window.setTimeout(() => {
        isLocked = false;
      }, lockMs);
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
        scrollToSection(currentSectionIndex() + direction);
      },
      { passive: false },
    );
  };

  initSectionWheelLock();
})();
