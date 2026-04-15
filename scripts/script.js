// Theme handling (light / dark)
const THEME_KEY = "themePreference";

function applyTheme(theme) {
  document.documentElement.classList.remove("theme-light", "theme-dark");
  document.documentElement.classList.add(`theme-${theme}`);
  const btn = document.getElementById("theme-toggle");
  if (btn)
    btn.innerHTML =
      theme === "light"
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  const prefersLight =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  const theme = stored || (prefersLight ? "light" : "dark");
  applyTheme(theme);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains("theme-dark");
  const next = isDark ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
  try {
    document.dispatchEvent(new Event("themechange"));
  } catch (e) {}
}

// Preload critical resources referenced in the HTML (styles, scripts, images, icons, fonts)
async function preloadResources(timeout = 5000) {
  const seen = new Set();
  const resources = [];
  document.querySelectorAll('link[rel="stylesheet"]').forEach((l) => {
    if (!l.href) return;
    try {
      const u = new URL(l.href, location.href);
      if (
        u.hostname.includes("fonts.googleapis.com") ||
        u.hostname.includes("fonts.gstatic.com")
      ) {
        resources.push({ href: u.origin, as: "preconnect" });
      } else if (u.origin === location.origin) {
        resources.push({ href: u.href, as: "style" });
      }
    } catch (e) {}
  });

  // collect scripts: avoid preloading external CDN scripts
  document.querySelectorAll("script[src]").forEach((s) => {
    if (!s.src) return;
    try {
      const u = new URL(s.src, location.href);
      if (u.origin === location.origin) {
        resources.push({ href: u.href, as: "script" });
      }
    } catch (e) {}
  });

  // icons and images: only preload same-origin assets
  document.querySelectorAll('link[rel="icon"]').forEach((i) => {
    if (i.href)
      try {
        const u = new URL(i.href, location.href);
        if (u.origin === location.origin)
          resources.push({ href: u.href, as: "image" });
      } catch (e) {}
  });
  document.querySelectorAll("img[src]").forEach((img) => {
    if (img.src)
      try {
        const u = new URL(img.src, location.href);
        if (u.origin === location.origin)
          resources.push({ href: u.href, as: "image" });
      } catch (e) {}
  });

  const promises = resources.map((r) => {
    if (!r.href) return Promise.resolve();
    if (seen.has(r.href)) return Promise.resolve();
    seen.add(r.href);

    if (r.as === "preconnect") {
      return new Promise((resolve) => {
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = r.href;
        link.crossOrigin = "";
        document.head.appendChild(link);
        setTimeout(resolve, 50);
      });
    }

    return new Promise((resolve) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = r.as || "fetch";
      link.href = r.href;
      let done = false;

      function finish() {
        if (done) return;
        done = true;
        resolve();
      }

      link.onload = () => finish();
      link.onerror = () => finish();
      document.head.appendChild(link);

      setTimeout(() => finish(), timeout);
    });
  });

  await Promise.all(promises);
}

// Loader control helpers
function showLoader() {
  const l = document.getElementById("site-loader");
  if (!l) return;
  l.classList.remove("hidden");
  l.setAttribute("aria-hidden", "false");
}

function hideLoader() {
  const l = document.getElementById("site-loader");
  if (!l) return;
  l.classList.add("hidden");
  l.setAttribute("aria-hidden", "true");
  try {
    document.body.classList.add("loaded");
  } catch (e) {}
}

// AOS Initialization
AOS.init({
  duration: 600,
  easing: "ease-out-cubic",
  once: false,
  mirror: false,
  offset: 100,
  delay: 60,
  anchorPlacement: "top-bottom",
});

// Smooth Scrolling (header offset computed from navbar)
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const nav = document.getElementById("main-nav");
    const headerOffset = nav ? nav.offsetHeight + 12 : 80;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - headerOffset;

    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    document
      .querySelectorAll(".nav-link")
      .forEach((l) => l.classList.remove("active"));
    if (this.classList.contains("nav-link")) this.classList.add("active");
  });
});

// Active section highlighting using IntersectionObserver
let _sectionObserver = null;
function initSectionObserver() {
  if (_sectionObserver) {
    _sectionObserver.disconnect();
    _sectionObserver = null;
  }
  const nav = document.getElementById("main-nav");
  const navHeight = nav ? nav.offsetHeight + 12 : 80;
  const options = {
    root: null,
    rootMargin: `-${navHeight}px 0px -40% 0px`,
    threshold: 0.15,
  };
  _sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const id = entry.target.id;
      const link = document.querySelector(`.nav-link[href="#${id}"]`);
      if (entry.isIntersecting) {
        document
          .querySelectorAll(".nav-link")
          .forEach((l) => l.classList.remove("active"));
        if (link) link.classList.add("active");
      }
    });
  }, options);
  document
    .querySelectorAll("section[id]")
    .forEach((section) => _sectionObserver.observe(section));
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => initSectionObserver(), 250);
  });

  // ensure AOS positions refresh after observer is setup
  try {
    AOS.refresh();
  } catch (e) {}
}

// Typed.js initialization (lazy)
function initTyped() {
  const makeTyped = () => {
    try {
      new Typed("#typed-text", {
        strings: [
          "Student",
          "Red Teamer",
          "Linux Enthusiast",
          "Full-Stack Dev",
          "Creative Designer",
        ],
        typeSpeed: 50,
        backSpeed: 50,
        loop: true,
        showCursor: true,
        cursorChar: "|",
      });
    } catch (e) {}
  };

  if (typeof Typed === "undefined") {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/typed.js@2.0.12";
    s.defer = true;
    s.onload = makeTyped;
    document.head.appendChild(s);
  } else {
    makeTyped();
  }
}

function initTerminalIntel() {
  var sessionEl = document.getElementById("terminal-session-id");
  var uptimeEl = document.getElementById("terminal-uptime");
  var modeEl = document.getElementById("terminal-mode");
  var syncEl = document.getElementById("terminal-sync");
  var commandEl = document.getElementById("terminal-command");
  var outputEl = document.getElementById("terminal-output");

  if (!sessionEl || !uptimeEl || !modeEl || !syncEl || !commandEl || !outputEl) return;

  var sessionId = "0x" + Math.random().toString(16).slice(2, 8).toUpperCase();
  var start = Date.now();
  var modeCycle = ["analysis", "recon", "build", "deploy"];
  var syncCycle = ["idle", "syncing", "verified", "live"];
  var snippetCycle = [
    { cmd: "./telemetry --brief", out: "status=ready latency=17ms integrity=ok" },
    { cmd: "git log --oneline -n 1", out: "head=main ui: refine glass terminal" },
    { cmd: "nmap --top-ports 10 localhost", out: "open:22,80,443 filtered:3306" },
    { cmd: "echo \"open to collaboration\"", out: "contact: d.mokshyagnayadav@gmail.com" },
  ];

  sessionEl.textContent = sessionId;

  function tickUptime() {
    var elapsed = Math.floor((Date.now() - start) / 1000);
    var h = Math.floor(elapsed / 3600).toString().padStart(2, "0");
    var m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, "0");
    var s = (elapsed % 60).toString().padStart(2, "0");
    uptimeEl.textContent = h + ":" + m + ":" + s;
  }

  var idx = 0;
  function rotateTelemetry() {
    var snippet = snippetCycle[idx % snippetCycle.length];
    commandEl.textContent = snippet.cmd;
    outputEl.textContent = snippet.out;
    modeEl.textContent = modeCycle[idx % modeCycle.length];
    syncEl.textContent = syncCycle[idx % syncCycle.length];
    idx++;
  }

  tickUptime();
  rotateTelemetry();
  setInterval(tickUptime, 1000);
  setInterval(rotateTelemetry, 3200);
}

// Load GitHub Repositories
const GITHUB_USERNAME = "Sensui-moksha";
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;

const GITHUB_CACHE_KEY = "github_repos_cache_v1";
const GITHUB_CACHE_TTL = 1000 * 60 * 60;

function renderRepos(repos) {
  const sortedRepos = repos
    .filter((repo) => !repo.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6);

  const reposContainer = document.getElementById("github-repos");
  const template = document.getElementById("repo-template");
  const loadingSpinner = document.querySelector(".loading-spinner");
  if (loadingSpinner && loadingSpinner.remove) loadingSpinner.remove();

  sortedRepos.forEach((repo) => {
    const card = template.content.cloneNode(true);

    card.querySelector("h3").textContent = repo.name;
    card.querySelector(".repo-description").textContent =
      repo.description || "No description available";
    card.querySelector(".repo-language").textContent = repo.language || "N/A";
    card.querySelector(".repo-stars").textContent = repo.stargazers_count;
    const updated = new Date(repo.pushed_at || repo.updated_at || Date.now());
    card.querySelector(".repo-updated").textContent =
      updated.getFullYear() + "-" + String(updated.getMonth() + 1).padStart(2, "0");
    card.querySelector(".repo-link").href = repo.html_url;

    reposContainer.appendChild(card);
  });
}

async function loadGitHubRepos() {
  try {
    // Try local cache first
    try {
      const cached = localStorage.getItem(GITHUB_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          parsed &&
          Date.now() - parsed.ts < GITHUB_CACHE_TTL &&
          parsed.repos
        ) {
          renderRepos(parsed.repos);
          return;
        }
      }
    } catch (e) {
      /* ignore cache errors */
    }

    const response = await fetch(GITHUB_API_URL);
    const repos = await response.json();

    // store cache
    try {
      localStorage.setItem(
        GITHUB_CACHE_KEY,
        JSON.stringify({ ts: Date.now(), repos }),
      );
    } catch (e) {}

    renderRepos(repos);
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    const loadingSpinner = document.querySelector(".loading-spinner");
    if (loadingSpinner) {
      loadingSpinner.innerHTML = `
                <p class="text-red-500">Error loading repositories. Please try again later or try refreshing the page !!</p>
            `;
    }
  }
}

// Cyber Matrix Background Script
function initializeMatrixBackground() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);
  const chars =
    "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?~アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヰヱヲン一二三四五六七八九十百千口目手足心日日年小大中上下左右前后里外走来去看听说读写吃喝朋友家学校书马鱼鸟花";
  const drops = [];
  const fontSize = 10;
  let columns = 0;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const newColumns = Math.floor(canvas.width / fontSize) || 1;
    if (newColumns > columns) {
      for (let i = columns; i < newColumns; i++)
        drops[i] = Math.floor((Math.random() * canvas.height) / fontSize);
    } else if (newColumns < columns) {
      drops.length = newColumns;
    }
    columns = newColumns;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // colors adapt to theme
  let bgFade = "rgba(0,0,0,0.05)";
  let charColor = `rgba(${getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb") || "200,29,37"},0.95)`;

  function updateMatrixColors() {
    const cs = getComputedStyle(document.documentElement);
    const accentRgb = cs.getPropertyValue("--accent-rgb").trim() || "200,29,37";
    const isLight = document.documentElement.classList.contains("theme-light");
    charColor = `rgba(${accentRgb},${isLight ? 0.85 : 0.95})`;
    bgFade = isLight ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.05)";
  }

  updateMatrixColors();
  document.addEventListener("themechange", updateMatrixColors);

  function draw() {
    ctx.fillStyle = bgFade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = charColor;
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  const interval = setInterval(draw, 35);
  const observer = new MutationObserver(() => {
    if (!document.body.contains(canvas)) clearInterval(interval);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Certifications
function loadCertifications() {
  fetch("/scripts/certifications.json")
    .then((response) => response.json())
    .then((data) => {
      const certificationsContainer = document.getElementById(
        "certifications-container",
      );
      const certificationTemplate = document.getElementById(
        "certification-template",
      );

      data.certifications.forEach((certification) => {
        const clone = certificationTemplate.content.cloneNode(true);
        clone.querySelector(".certification-title").textContent =
          certification.title;
        clone.querySelector(".certification-issuer").textContent =
          `Issuer: ${certification.issuer}`;
        clone.querySelector(".certification-date").textContent =
          `Date: ${certification.date}`;
        clone.querySelector(".certification-description").textContent =
          certification.description;

        certificationsContainer.appendChild(clone);
      });
    })
    .catch((error) => console.error("Error loading certifications:", error));
}

// Education
function loadEducation() {
  fetch("/scripts/education.json")
    .then((response) => response.json())
    .then((data) => {
      const educationContainer = document.getElementById("education-container");
      const educationTemplate = document.getElementById("education-template");

      data.education.forEach((item) => {
        const clone = educationTemplate.content.cloneNode(true);
        clone.querySelector(".education-degree").textContent = item.degree;
        clone.querySelector(".education-institution").textContent =
          item.institution;
        clone.querySelector(".education-description").textContent =
          item.description;

        educationContainer.appendChild(clone);
      });
    })
    .catch((error) => console.error("Error loading education data:", error));
}

// Skills
function loadSkills() {
  fetch("/scripts/skills.json")
    .then((response) => response.json())
    .then((data) => {
      const skillsContainer = document.getElementById("skills-container");
      const skillsTemplate = document.getElementById("skills-template");

      data.skills.forEach((skill) => {
        const clone = skillsTemplate.content.cloneNode(true);
        clone.querySelector(".skill-category").textContent = skill.category;

        const skillList = clone.querySelector(".skill-list");
        skill.items.forEach((item) => {
          const listItem = document.createElement("li");
          listItem.classList.add("flex", "items-center", "space-x-2");

          // Adds skill logo
          const logo = document.createElement("img");
          logo.src = item.logo;
          logo.alt = `${item.name} logo`;
          logo.classList.add("w-6", "h-6");

          // Adds skill name
          const skillName = document.createElement("span");
          skillName.textContent = item.name;

          listItem.appendChild(logo);
          listItem.appendChild(skillName);
          skillList.appendChild(listItem);
        });

        skillsContainer.appendChild(clone);
      });
    })
    .catch((error) => console.error("Error loading skills data:", error));
}

function initCardGlow() {
  if (window.matchMedia("(max-width: 768px)").matches) return;

  var mouseX = -9999, mouseY = -9999;
  var cardCache = [];
  var rectCache = new WeakMap();
  var viewH = window.innerHeight;
  var rectsStale = true;

  function refreshCards() {
    cardCache = Array.from(document.querySelectorAll(".card"));
    rectsStale = true;
  }
  refreshCards();

  new MutationObserver(refreshCards)
    .observe(document.body, { childList: true, subtree: true });

  function updateRects() {
    for (var i = 0; i < cardCache.length; i++) {
      rectCache.set(cardCache[i], cardCache[i].getBoundingClientRect());
    }
    rectsStale = false;
  }

  window.addEventListener("scroll", function () { rectsStale = true; }, { passive: true });
  window.addEventListener("resize", function () { viewH = window.innerHeight; rectsStale = true; });

  document.addEventListener("mousemove", function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function tick() {
    if (rectsStale) updateRects();

    for (var i = 0; i < cardCache.length; i++) {
      var card = cardCache[i];
      var rect = rectCache.get(card);
      if (!rect) continue;
      if (rect.bottom < -200 || rect.top > viewH + 200) continue;

      card.style.setProperty("--mouse-x", (mouseX - rect.left) + "px");
      card.style.setProperty("--mouse-y", (mouseY - rect.top) + "px");
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

document.addEventListener("DOMContentLoaded", () => {
  function initAll() {
    initTheme();
    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);
    var mobileThemeBtn = document.getElementById("mobile-theme-toggle");
    if (mobileThemeBtn) mobileThemeBtn.addEventListener("click", toggleTheme);

    loadGitHubRepos();

    var idleStart = function (fn) {
      if ("requestIdleCallback" in window)
        requestIdleCallback(fn, { timeout: 1500 });
      else setTimeout(fn, 500);
    };

    idleStart(initializeMatrixBackground);
    idleStart(initTyped);
    idleStart(initTerminalIntel);
    loadCertifications();
    loadEducation();
    loadSkills();
    initSectionObserver();
    initCardGlow();
    clearTimeout(safetyTimer);
    setTimeout(hideLoader, 200);
  }

  var safetyTimer = setTimeout(hideLoader, 8000);
  preloadResources(6000).then(initAll).catch(initAll);
});
