(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Current page highlighting
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  $$("[data-nav]").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.setAttribute("aria-current", "page");
  });

  // Mobile drawer
  const drawer = $("#mobileDrawer");
  const toggle = $("#mobileToggle");
  if (drawer && toggle) {
    const setOpen = (open) => {
      drawer.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    toggle.addEventListener("click", () => setOpen(!drawer.classList.contains("open")));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
    $$("#mobileDrawer a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  }

  // Writings filter
  const filterWrap = $("#filters");
  if (filterWrap) {
    const buttons = $$(".filter-btn", filterWrap);
    const posts = $$("[data-post]");
    const setActive = (cat) => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.filter === cat ? "true" : "false"));
      posts.forEach((p) => {
        const ok = cat === "all" || (p.dataset.category || "") === cat;
        p.style.display = ok ? "" : "none";
      });
    };
    buttons.forEach((b) => b.addEventListener("click", () => setActive(b.dataset.filter || "all")));
    setActive("all");
  }

  // Media filter + modal
  const galleryFilters = $("#galleryFilters");
  const modal = $("#modal");
  if (galleryFilters) {
    const buttons = $$(".filter-btn", galleryFilters);
    const items = $$("[data-media]");
    const setActive = (type) => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.filter === type ? "true" : "false"));
      items.forEach((it) => {
        const ok = type === "all" || (it.dataset.type || "") === type;
        it.style.display = ok ? "" : "none";
      });
    };
    buttons.forEach((b) => b.addEventListener("click", () => setActive(b.dataset.filter || "all")));
    setActive("all");
  }

  if (modal) {
    const title = $("#modalTitle");
    const body = $("#modalBody");
    const close = $("#modalClose");
    const backdrop = $("#modalBackdrop");

    const setOpen = (open) => {
      modal.classList.toggle("open", open);
      modal.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) close?.focus();
    };

    const openFrom = (btn) => {
      const t = btn.getAttribute("data-title") || "Media";
      const desc = btn.getAttribute("data-desc") || "";
      if (title) title.textContent = t;
      if (body) body.textContent = desc;
      setOpen(true);
    };

    $$("[data-open-modal]").forEach((btn) => btn.addEventListener("click", () => openFrom(btn)));
    close?.addEventListener("click", () => setOpen(false));
    backdrop?.addEventListener("click", () => setOpen(false));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // Contact form (client-only, no backend)
  const contact = $("#contactForm");
  if (contact) {
    const toast = $("#toast");
    contact.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const payload = {
        name: String(data.get("name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        topic: String(data.get("topic") || "").trim(),
        message: String(data.get("message") || "").trim(),
      };

      const ok = payload.name && payload.email.includes("@") && payload.message.length >= 10;
      if (!ok) {
        toast?.classList.add("show");
        if (toast) toast.textContent = "Please fill name, a valid email, and a message (10+ characters).";
        return;
      }

      // In a real deployment, POST payload to your backend endpoint.
      form.reset();
      toast?.classList.add("show");
      if (toast) toast.textContent = "Message prepared. Add a backend endpoint to deliver it.";
    });
  }

  // YouTube thumbnails → click to play (lazy iframe)
  $$(".yt-frame").forEach((el) => {
    const id = String(el.getAttribute("data-video") || "").trim();
    const looksLikeId = /^[a-zA-Z0-9_-]{8,}$/.test(id) && !id.startsWith("VIDEO_ID_");
    if (!looksLikeId) {
      el.classList.add("yt-placeholder");
      el.innerHTML = "<div class='yt-ph-inner'><div class='yt-ph-badge'>YouTube</div><div class='yt-ph-title'>Add a video ID</div><div class='yt-ph-sub'>Replace <strong>VIDEO_ID_*</strong> in HTML</div></div>";
      return;
    }

    const thumb = `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "yt-thumb";
    btn.setAttribute("aria-label", "Play YouTube video");
    btn.style.backgroundImage = `url('${thumb}')`;
    btn.innerHTML = "<span class='yt-play' aria-hidden='true'></span>";

    const load = () => {
      el.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.width = "560";
      iframe.height = "315";
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`;
      iframe.title = "YouTube video";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      el.appendChild(iframe);
    };
    btn.addEventListener("click", load);

    el.appendChild(btn);
  });

  // Count-up numbers (views/subscribers/videos)
  const countEls = $$("[data-countup]");
  if (countEls.length) {
    const fmt = new Intl.NumberFormat(undefined);
    const animate = (el) => {
      if (el.dataset.done === "1") return;
      el.dataset.done = "1";
      const target = Number(el.getAttribute("data-value") || "0");
      const suffix = String(el.getAttribute("data-suffix") || "");
      if (!Number.isFinite(target) || target <= 0) return;
      const start = 0;
      const dur = 900;
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const val = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3)));
        el.textContent = `${fmt.format(val)}${suffix}`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) animate(e.target);
        });
      }, { threshold: 0.25 });
      countEls.forEach((el) => io.observe(el));
    } else {
      countEls.forEach(animate);
    }
  }
})();

