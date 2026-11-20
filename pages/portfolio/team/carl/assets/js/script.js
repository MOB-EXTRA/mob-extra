// ==========================================
// DYNAMIC TIME-BASED GREETING
// Uses the website visitor's local time zone
// ==========================================

function updateGreeting() {
  const greetingElement = document.querySelector(".greeting-tag");

  if (!greetingElement) return;

  const currentHour = new Date().getHours();

  let greeting;

  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Good morning.";
  } else if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good afternoon.";
  } else {
    greeting = "Good evening.";
  }

  greetingElement.textContent = greeting;
}

// Run immediately when the page loads
updateGreeting();

// Refresh every minute
setInterval(updateGreeting, 60000);

// ==========================================
// MOBILE NAVIGATION
// ==========================================

const menuButton = document.querySelector(".menu-toggle");
const navRight = document.querySelector(".nav-right");

if (menuButton && navRight) {
  menuButton.addEventListener("click", () => {
    const isOpen = navRight.classList.toggle("is-open");

    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".main-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      navRight.classList.remove("is-open");

      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

// ==========================================
// SCROLL-SYNCED SLIDING NAV UNDERLINE
// ==========================================

(() => {
  const mainNav = document.querySelector(".main-nav");
  if (!mainNav) return;

  const indicator = mainNav.querySelector(".nav-indicator");
  const navLinks = Array.from(mainNav.querySelectorAll("a[href^='#']")).filter(
    (link) => link.getBoundingClientRect().width > 0,
  );

  if (!indicator || !navLinks.length) return;

  const sections = navLinks
    .map((link) => {
      const targetId = link.getAttribute("href");
      const section = targetId ? document.querySelector(targetId) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  function moveIndicatorTo(targetLink) {
    if (!targetLink || targetLink.getBoundingClientRect().width === 0) {
      indicator.style.opacity = "0";
      return;
    }

    const navRect = mainNav.getBoundingClientRect();
    const linkRect = targetLink.getBoundingClientRect();
    const leftOffset = linkRect.left - navRect.left;

    indicator.style.width = `${linkRect.width}px`;
    indicator.style.transform = `translateX(${leftOffset}px)`;
    indicator.style.opacity = "1";
  }

  function setActiveLink(activeLink) {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link === activeLink);
    });
    moveIndicatorTo(activeLink);
  }

  function syncActiveSection() {
    const scrollPos = window.scrollY + 150;
    const nearBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 40;

    let currentItem = sections[0];

    if (nearBottom && sections.length > 0) {
      currentItem = sections[sections.length - 1];
    } else {
      for (const item of sections) {
        if (item.section.offsetTop <= scrollPos) {
          currentItem = item;
        }
      }
    }

    if (currentItem) {
      setActiveLink(currentItem.link);
    }
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setActiveLink(link);
    });
  });

  let scrollTicking = false;
  function onScrollOrResize() {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(() => {
        syncActiveSection();
        scrollTicking = false;
      });
    }
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  window.addEventListener("load", syncActiveSection);
  syncActiveSection();
})();

// ==========================================
// COPY OFFICE ADDRESS BUTTON
// ==========================================

(() => {
  const copyButtons = document.querySelectorAll("[data-copy-target]");
  copyButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetSelector = btn.getAttribute("data-copy-target");
      const targetEl = targetSelector
        ? document.querySelector(targetSelector)
        : null;
      const labelEl = btn.querySelector("span");
      if (!targetEl) return;

      const textToCopy = targetEl.textContent.trim();
      try {
        await navigator.clipboard.writeText(textToCopy);
        if (labelEl) {
          const original = labelEl.textContent;
          labelEl.textContent = "Copied!";
          setTimeout(() => {
            labelEl.textContent = original;
          }, 1800);
        }
      } catch {
        // Fallback if clipboard permission is blocked
      }
    });
  });
})();
