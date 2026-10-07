(function() {
  "use strict";
  var header, navToggle, navMobile, navOverlay;
  function init() {
    header = document.getElementById("siteHeader");
    navToggle = document.getElementById("navToggle");
    navMobile = document.getElementById("navMobile");
    navOverlay = document.getElementById("navOverlay");
    function handleScroll() {
      if (!header) return;
      // data-header-light : pages sans bandeau sombre derrière l'en-tête (ex. article de blog) -> en-tête clair dès le haut de page
      if (window.scrollY > 60 || document.body.hasAttribute("data-header-light")) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    }
    let ticking = false;
    window.addEventListener("scroll", function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    handleScroll();
    function openMenu() {
      if (!navMobile || !navOverlay) return;
      navMobile.classList.add("open");
      navMobile.setAttribute("aria-hidden", "false");
      navOverlay.classList.add("visible");
      document.body.classList.add("menu-open");
      const firstLink = navMobile.querySelector(".nav-mobile__link");
      if (firstLink) {
        setTimeout(function() {
          firstLink.focus();
        }, 100);
      }
      if (navToggle) {
        navToggle.setAttribute("aria-expanded", "true");
        navToggle.setAttribute("aria-label", "Men\xFC schlie\xDFen");
        navToggle.classList.add("open");
      }
    }
    function closeMenu(opts) {
      if (!navMobile || !navOverlay) return;
      navMobile.classList.remove("open");
      navMobile.setAttribute("aria-hidden", "true");
      navOverlay.classList.remove("visible");
      document.body.classList.remove("menu-open");
      if (navToggle) {
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Men\xFC \xF6ffnen");
        navToggle.classList.remove("open");
        if (opts && opts.restoreFocus) navToggle.focus();
      }
    }
    if (navToggle) {
      navToggle.addEventListener("click", function() {
        const isOpen = navMobile && navMobile.classList.contains("open");
        isOpen ? closeMenu({ restoreFocus: true }) : openMenu();
      });
    }
    if (navOverlay) {
      navOverlay.addEventListener("click", function() { closeMenu(); });
    }
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape") closeMenu({ restoreFocus: true });
    });
    function setActiveLinks() {
      const currentPath = window.location.pathname;
      const allNavLinks = document.querySelectorAll(
        ".nav-desktop__link, .nav-mobile__link"
      );
      allNavLinks.forEach(function(link) {
        const linkPath = link.getAttribute("href");
        if (!linkPath) return;
        const linkFile = linkPath.split("/").pop() || "index.html";
        const currentFile = currentPath.split("/").pop() || "index.html";
        const isHome = currentFile === "" || currentFile === "index.html";
        const linkIsHome = linkFile === "index.html" || linkFile === "";
        if (isHome && linkIsHome) {
          link.classList.add("active");
        } else if (!isHome && linkFile === currentFile) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    }
    setActiveLinks();
    if (navMobile) {
      navMobile.querySelectorAll(".nav-mobile__link").forEach(function(link) {
        link.addEventListener("click", function() {
          closeMenu();
        });
      });
    }
    window.addEventListener("resize", function() {
      if (window.innerWidth > 1024) {
        closeMenu();
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
