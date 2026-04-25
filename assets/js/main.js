(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Current page highlighting
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  $$("[data-nav]").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.setAttribute("aria-current", "page");
  });

  // Section title icons
  const sectionTitleIconMap = {
    coreIdea: "sparkles",
    workOn: "compass",
    initiatives: "layers",
    mediaReach: "radio",
    softCta: "heart-handshake",
    whatIs: "book-open",
    fragmented: "split",
    alchemy: "flame",
    architecture: "drafting-compass",
    areas: "target",
    manifesto: "scroll-text",
    next: "arrow-right-circle",
    csl: "leaf",
    rd: "messages-square",
    mp: "mic",
    fv: "telescope",
    opening: "eye",
    problem: "alert-triangle",
    shift: "refresh-cw",
    howItWorks: "cog",
    whatItIsNot: "shield-x",
    whatItLeadsTo: "route",
    innerAlchemy: "flame-kindling",
    innerArchitecture: "building-2",
  };
  Object.entries(sectionTitleIconMap).forEach(([id, icon]) => {
    const title = document.getElementById(id);
    if (!title || title.querySelector(".title-icon-wrap")) return;
    const iconWrap = document.createElement("span");
    iconWrap.className = "title-icon-wrap";
    iconWrap.setAttribute("aria-hidden", "true");
    iconWrap.innerHTML = `<i data-lucide="${icon}" class="title-icon"></i>`;
    title.prepend(iconWrap);
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

  // Home hero Hindi quote carousel
  const quoteTrack = $("[data-quote-track]");
  if (quoteTrack) {
    const slides = $$("[data-quote-slide]", quoteTrack);
    const dotsWrap = $("[data-quote-dots]");
    const prevBtn = $("[data-quote-prev]");
    const nextBtn = $("[data-quote-next]");
    let current = slides.findIndex((s) => s.classList.contains("is-active"));
    if (current < 0) current = 0;

    const render = () => {
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === current));
      if (dotsWrap) {
        $$("[data-quote-dot]", dotsWrap).forEach((dot, i) => {
          dot.classList.toggle("is-active", i === current);
          dot.setAttribute("aria-pressed", i === current ? "true" : "false");
        });
      }
    };

    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "hero-quote-dot";
        b.setAttribute("data-quote-dot", "");
        b.setAttribute("aria-label", `Go to quote ${i + 1}`);
        b.addEventListener("click", () => {
          current = i;
          render();
          restart();
        });
        dotsWrap.appendChild(b);
      });
    }

    prevBtn?.addEventListener("click", () => {
      current = (current - 1 + slides.length) % slides.length;
      render();
      restart();
    });
    nextBtn?.addEventListener("click", () => {
      current = (current + 1) % slides.length;
      render();
      restart();
    });

    let timer = null;
    const start = () => {
      timer = window.setInterval(() => {
        current = (current + 1) % slides.length;
        render();
      }, 4500);
    };
    const restart = () => {
      if (timer) window.clearInterval(timer);
      start();
    };
    render();
    start();
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
    // If form is configured for server submission, keep native submit behavior.
    if (contact.getAttribute("data-server-submit") === "true") return;
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

  const toFiniteNumber = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string") return NaN;
    const n = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : NaN;
  };

  const parseMixernoStats = (payload) => {
    const counts = Array.isArray(payload?.counts) ? payload.counts : [];
    const get = (k1, k2) => {
      const a = counts.find((x) => x?.value === k1)?.count;
      const b = counts.find((x) => x?.value === k2)?.count;
      return toFiniteNumber(a ?? b);
    };
    return {
      subscribers: get("apisubscribers", "subscribers"),
      views: get("apiviews", "views"),
      videos: get("videos", "apivideos"),
    };
  };

  const parseSocialCountsStats = (payload) => {
    const api = payload?.counters?.api || {};
    const est = payload?.counters?.estimation || {};
    return {
      subscribers: toFiniteNumber(api.subscriberCount ?? est.subscriberCount),
      views: toFiniteNumber(api.viewCount ?? est.viewCount),
      videos: toFiniteNumber(api.videoCount ?? est.videoCount),
    };
  };

  const fetchChannelStats = async (channelId) => {
    // Primary source (currently stable)
    try {
      const mixerno = await fetch(
        `https://mixerno.space/api/youtube-channel-counter/user/${encodeURIComponent(channelId)}`,
        { cache: "no-store" }
      );
      if (mixerno.ok) {
        const json = await mixerno.json();
        const stats = parseMixernoStats(json);
        if (Number.isFinite(stats.subscribers) || Number.isFinite(stats.views)) return stats;
      }
    } catch (_e) {}

    // Fallback source
    try {
      const social = await fetch(
        `https://api.socialcounts.org/youtube-live-subscriber-count/${encodeURIComponent(channelId)}`,
        { cache: "no-store" }
      );
      if (social.ok) {
        const json = await social.json();
        const stats = parseSocialCountsStats(json);
        if (Number.isFinite(stats.subscribers) || Number.isFinite(stats.views)) return stats;
      }
    } catch (_e) {}

    return { subscribers: NaN, views: NaN, videos: NaN };
  };

  // Live YouTube stats on media page
  const channelCards = $$("[data-channel-id]");
  if (channelCards.length) {
    const fallbackByChannel = {
      UCGyDe2To67_wCtHgYQWo2kw: { subs: 250000, views: 2100000 }, // The Sarvesh Mishra Show
      UCuhtdS3A51_5NCICv9_pX6w: { subs: 110000, views: 900000 },  // The Inner Wealth
      UCFVm7tBFWnxzTJpkt_s96Aw: { subs: 40000, views: 500000 },   // The Urban Sannyasi
    };
    const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
    const compact = (n) => {
      if (!Number.isFinite(n)) return "N/A";
      if (n >= 1_000_000_000) return `${nf.format(n / 1_000_000_000)}B`;
      if (n >= 1_000_000) return `${nf.format(n / 1_000_000)}M`;
      if (n >= 1_000) return `${nf.format(n / 1_000)}K`;
      return nf.format(n);
    };

    const loadChannel = async (card) => {
      const channelId = card.getAttribute("data-channel-id");
      const subsEl = card.querySelector('[data-stat="subs"]');
      const viewsEl = card.querySelector('[data-stat="views"]');
      if (!channelId || !subsEl || !viewsEl) return;

      try {
        const { subscribers, views } = await fetchChannelStats(channelId);
        const fb = fallbackByChannel[channelId] || {};
        const finalSubs = Number.isFinite(subscribers) ? subscribers : fb.subs;
        const finalViews = Number.isFinite(views) ? views : fb.views;
        subsEl.textContent = Number.isFinite(finalSubs) ? compact(finalSubs) : "400K+";
        viewsEl.textContent = Number.isFinite(finalViews) ? compact(finalViews) : "3.5M+";
      } catch (_err) {
        const fb = fallbackByChannel[channelId] || {};
        subsEl.textContent = Number.isFinite(fb.subs) ? compact(fb.subs) : "400K+";
        viewsEl.textContent = Number.isFinite(fb.views) ? compact(fb.views) : "3.5M+";
      }
    };

    const refreshAll = () => Promise.all(channelCards.map((card) => loadChannel(card)));
    refreshAll();
    window.setInterval(refreshAll, 300000);
  }

  // Home page combined media reach (live aggregate from 3 channels)
  const homeReach = $("#homeMediaReach");
  if (homeReach) {
    const homeFallback = { subs: 400000, views: 3500000, videos: 200 };
    const viewEl = homeReach.querySelector('[data-home-stat="views"]');
    const subEl = homeReach.querySelector('[data-home-stat="subs"]');
    const videoEl = homeReach.querySelector('[data-home-stat="videos"]');
    const ids = [
      "UCGyDe2To67_wCtHgYQWo2kw", // The Sarvesh Mishra Show
      "UCuhtdS3A51_5NCICv9_pX6w", // The Inner Wealth
      "UCFVm7tBFWnxzTJpkt_s96Aw", // The Urban Sannyasi
    ];
    const fmtCompact = (n) => {
      if (!Number.isFinite(n)) return "N/A";
      return new Intl.NumberFormat(undefined, {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(n);
    };

    const loadCombined = async () => {
      try {
        const responses = await Promise.all(ids.map((id) => fetchChannelStats(id)));
        const total = responses.reduce(
          (acc, item) => {
            acc.subs += Number.isFinite(item.subscribers) ? item.subscribers : 0;
            acc.views += Number.isFinite(item.views) ? item.views : 0;
            acc.videos += Number.isFinite(item.videos) ? item.videos : 0;
            return acc;
          },
          { subs: 0, views: 0, videos: 0 }
        );
        if (viewEl) viewEl.textContent = fmtCompact(total.views || homeFallback.views);
        if (subEl) subEl.textContent = fmtCompact(total.subs || homeFallback.subs);
        if (videoEl) videoEl.textContent = new Intl.NumberFormat().format(total.videos || homeFallback.videos);
      } catch (_err) {
        if (viewEl) viewEl.textContent = fmtCompact(homeFallback.views);
        if (subEl) subEl.textContent = fmtCompact(homeFallback.subs);
        if (videoEl) videoEl.textContent = `${homeFallback.videos}+`;
      }
    };

    loadCombined();
    window.setInterval(loadCombined, 300000);
  }

  if (window.lucide) {
    window.lucide.createIcons();
  } else {
    window.addEventListener("DOMContentLoaded", () => {
      if (window.lucide) window.lucide.createIcons();
    });
  }
})();

