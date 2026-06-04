(() => {
  const page = document.querySelector("[data-about-page]");

  if (!page) {
    return;
  }

  const progressBar = document.querySelector("[data-about-progress]");
  const letters = Array.from(document.querySelectorAll("[data-story-letter]"));
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  const closingSequence = document.querySelector("[data-closing-sequence]");
  const closingPrimary = document.querySelector("[data-closing-primary]");
  const closingSecondary = document.querySelector("[data-closing-secondary]");
  const closingSecondaryFocusItems = closingSecondary
    ? Array.from(closingSecondary.querySelectorAll("a, button, input, select, textarea, [tabindex]"))
    : [];
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const easeInOut = (value) => value * value * (3 - 2 * value);
  const easeOut = (value) => 1 - Math.pow(1 - value, 3);

  const updateProgress = () => {
    const maxScroll = page.scrollHeight - page.clientHeight;
    const progress = maxScroll <= 0 ? 0 : page.scrollTop / maxScroll;

    if (progressBar) {
      progressBar.style.transform = `scaleX(${clamp(progress)})`;
    }
  };

  const setClosingAccessibility = (isSecondaryActive) => {
    if (!closingPrimary || !closingSecondary) {
      return;
    }

    closingPrimary.setAttribute("aria-hidden", isSecondaryActive ? "true" : "false");
    closingSecondary.setAttribute("aria-hidden", isSecondaryActive ? "false" : "true");

    closingSecondaryFocusItems.forEach((item) => {
      item.tabIndex = isSecondaryActive ? 0 : -1;
    });
  };

  const updateClosingSequence = () => {
    if (!closingSequence || !closingPrimary || !closingSecondary) {
      return;
    }

    if (reducedMotionQuery.matches) {
      closingSequence.classList.remove("is-sequence-ready");
      closingPrimary.removeAttribute("aria-hidden");
      closingSecondary.removeAttribute("aria-hidden");
      closingSecondaryFocusItems.forEach((item) => {
        item.removeAttribute("tabindex");
      });
      return;
    }

    closingSequence.classList.add("is-sequence-ready");

    const travel = Math.max(1, closingSequence.offsetHeight - page.clientHeight);
    const progress = clamp((page.scrollTop - closingSequence.offsetTop) / travel);
    const exit = easeInOut(clamp((progress - 0.58) / 0.24));
    const enter = easeOut(clamp((progress - 0.74) / 0.22));

    closingSequence.style.setProperty("--closing-primary-opacity", (1 - exit).toFixed(3));
    closingSequence.style.setProperty("--closing-primary-y", `${Math.round(-74 * exit)}px`);
    closingSequence.style.setProperty("--closing-primary-blur", `${(7 * exit).toFixed(2)}px`);
    closingSequence.style.setProperty("--closing-secondary-opacity", enter.toFixed(3));
    closingSequence.style.setProperty("--closing-secondary-y", `${Math.round(78 * (1 - enter))}px`);
    closingSequence.style.setProperty("--closing-secondary-blur", `${(10 * (1 - enter)).toFixed(2)}px`);
    setClosingAccessibility(enter > 0.62);
  };

  const setActiveLetter = (letter) => {
    letters.forEach((item) => {
      item.classList.toggle("is-active", item.dataset.storyLetter === letter);
    });
  };

  const letterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveLetter(entry.target.dataset.letterCard);
        }
      });
    },
    {
      root: page,
      threshold: 0.52,
    },
  );

  document.querySelectorAll("[data-letter-card]").forEach((card) => {
    letterObserver.observe(card);
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    {
      root: page,
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.16,
    },
  );

  revealItems.forEach((item) => {
    revealObserver.observe(item);
  });

  const updateScrollEffects = () => {
    updateProgress();
    updateClosingSequence();
  };

  page.addEventListener("scroll", updateScrollEffects, { passive: true });
  window.addEventListener("resize", updateClosingSequence);
  reducedMotionQuery.addEventListener("change", updateClosingSequence);
  setActiveLetter("i1");
  updateScrollEffects();
})();
