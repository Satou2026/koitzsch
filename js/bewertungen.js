(function () {
  "use strict";

  function getApiBase() {
    return window.BlitzNotify && window.BlitzNotify.getApiBase ? window.BlitzNotify.getApiBase() : "https://api.blitzleihen.com";
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function starsHtml(rating) {
    var html = "";
    for (var i = 1; i <= 5; i++) {
      html += '<span class="star">' + (i <= rating ? "★" : "☆") + "</span>";
    }
    return html;
  }

  function initials(name) {
    var parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    var first = parts[0].charAt(0);
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + last).toUpperCase();
  }

  function renderCard(review) {
    var el = document.createElement("div");
    el.className = "testimonial-card animate-on-scroll";
    el.innerHTML =
      '<div class="testimonial-card__quote">"</div>' +
      '<div class="stars">' + starsHtml(review.rating) + "</div>" +
      '<p class="testimonial-card__text">' + escapeHtml(review.comment) + "</p>" +
      '<div class="testimonial-card__author">' +
      '<div class="testimonial-card__avatar">' + escapeHtml(initials(review.displayName)) + "</div>" +
      "<div>" +
      '<div class="testimonial-card__name">' + escapeHtml(review.displayName) + "</div>" +
      (review.verifiedCustomer ? '<span class="avis-verified">✅ Verifizierter Kunde</span>' : "") +
      "</div></div>";
    return el;
  }

  function injectStructuredData(reviews, stats) {
    if (!stats.total || !reviews.length) return; // jamais de schéma sans avis réels correspondants
    var itemReviewed = {
      "@type": "FinancialService",
      "name": "Finanzberatung Koitzsch u. Schuchardt",
      "url": "https://www.blitzleihen.com/"
    };
    var data = {
      "@context": "https://schema.org",
      "@type": "FinancialService",
      "name": "Finanzberatung Koitzsch u. Schuchardt",
      "url": "https://www.blitzleihen.com/",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": stats.moyenne,
        "reviewCount": stats.total,
        "bestRating": 5,
        "worstRating": 1
      },
      "review": reviews.slice(0, 10).map(function (r) {
        return {
          "@type": "Review",
          "reviewRating": { "@type": "Rating", "ratingValue": r.rating, "bestRating": 5, "worstRating": 1 },
          "author": { "@type": "Person", "name": r.displayName },
          "reviewBody": r.comment,
          "datePublished": (r.publishedAt || r.createdAt || "").substring(0, 10)
        };
      })
    };
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  function init() {
    var apiBase = getApiBase();
    fetch(apiBase + "/api/avis/publiques?limit=48")
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        var loading = document.getElementById("avisGridLoading");
        var empty = document.getElementById("avisGridEmpty");
        var grid = document.getElementById("avisGrid");
        var summary = document.getElementById("avisSummary");
        if (loading) loading.style.display = "none";

        if (!result.ok || !result.data || !result.data.data) {
          if (empty) empty.style.display = "block";
          return;
        }

        var reviews = result.data.data.reviews || [];
        var stats = result.data.data.stats || { moyenne: 0, total: 0 };

        if (!reviews.length) {
          if (empty) empty.style.display = "block";
          return;
        }

        if (summary) {
          summary.style.display = "flex";
          document.getElementById("avisSummaryScore").textContent = stats.moyenne.toFixed(1).replace(".", ",");
          document.getElementById("avisSummaryStars").innerHTML = starsHtml(Math.round(stats.moyenne));
          document.getElementById("avisSummaryMeta").textContent =
            stats.total + (stats.total === 1 ? " verifizierte Bewertung" : " verifizierte Bewertungen") + " von echten Kund:innen";
        }

        if (grid) {
          grid.style.display = "grid";
          reviews.forEach(function (r) {
            grid.appendChild(renderCard(r));
          });
        }

        injectStructuredData(reviews, stats);
      })
      .catch(function (err) {
        console.error("[Finanzberatung Koitzsch u. Schuchardt] Fehler beim Laden der Bewertungen:", err);
        var loading = document.getElementById("avisGridLoading");
        var empty = document.getElementById("avisGridEmpty");
        if (loading) loading.style.display = "none";
        if (empty) empty.style.display = "block";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
