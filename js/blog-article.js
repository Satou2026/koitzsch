(function () {
  "use strict";

  var SITE = "https://www.blitzleihen.com";
  var BRAND = "Finanzberatung Koitzsch u. Schuchardt";

  function getApiBase() {
    return window.BlitzNotify && window.BlitzNotify.getApiBase ? window.BlitzNotify.getApiBase() : "https://api.blitzleihen.com";
  }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function parseDate(s) { return s ? new Date(String(s).replace(" ", "T")) : null; }
  function formatDate(s) {
    var d = parseDate(s);
    return d && !isNaN(d) ? d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }) : "";
  }
  function isoDate(s) { var d = parseDate(s); return d && !isNaN(d) ? d.toISOString() : ""; }
  function sized(url, w) { return url.replace(/\/(f_auto,q_auto(?:,c_limit)?),w_\d+\//, "/$1,w_" + w + "/"); }

  function setMeta(selector, attr, value) {
    var m = document.querySelector(selector);
    if (m) m.setAttribute(attr, value);
  }
  // Crée la balise si elle n'existe pas encore (canonical et og:url ne sont volontairement pas dans le HTML statique).
  function ensureTag(selector, tag, attrs, valueAttr, value) {
    var node = document.querySelector(selector);
    if (!node) {
      node = document.createElement(tag);
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
      document.head.appendChild(node);
    }
    node.setAttribute(valueAttr, value);
  }

  // ---------- SEO dynamique : title, description, canonical, Open Graph, JSON-LD ----------
  function applySeo(a) {
    var url = SITE + "/blog-artikel.html?slug=" + encodeURIComponent(a.slug);
    var title = (a.metaTitle || a.title);
    var fullTitle = title.indexOf(BRAND) === -1 && title.indexOf("K&S") === -1 ? title + " | K&S Finanzberatung" : title;
    document.title = fullTitle;
    setMeta('meta[name="description"]', "content", a.metaDescription || a.excerpt);
    ensureTag('link[rel="canonical"]', "link", { rel: "canonical" }, "href", url);
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", a.metaDescription || a.excerpt);
    ensureTag('meta[property="og:url"]', "meta", { property: "og:url" }, "content", url);
    setMeta('meta[property="og:type"]', "content", "article");
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", a.metaDescription || a.excerpt);
    if (a.coverUrl) {
      var img = sized(a.coverUrl, 1200);
      setMeta('meta[property="og:image"]', "content", img);
      setMeta('meta[name="twitter:image"]', "content", img);
    }

    var graph = [
      {
        "@context": "https://schema.org", "@type": "BlogPosting",
        "headline": a.title, "description": a.metaDescription || a.excerpt,
        "image": a.coverUrl ? [sized(a.coverUrl, 1200)] : undefined,
        "datePublished": isoDate(a.publishedAt), "dateModified": isoDate(a.updatedAt || a.publishedAt),
        "mainEntityOfPage": { "@type": "WebPage", "@id": url },
        "author": a.authorName ? { "@type": "Person", "name": a.authorName } : { "@type": "Organization", "name": BRAND },
        "publisher": { "@type": "Organization", "name": BRAND, "logo": { "@type": "ImageObject", "url": SITE + "/finanzberatung-koitzsch-schuchardt-logo.webp" } },
        "articleSection": a.category || undefined, "inLanguage": "de-DE"
      },
      {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Startseite", "item": SITE + "/" },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog.html" },
          { "@type": "ListItem", "position": 3, "name": a.title, "item": url }
        ]
      }
    ];
    graph.forEach(function (obj) {
      var s = document.createElement("script");
      s.type = "application/ld+json";
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
    });
  }

  function render(a, related) {
    $("blogLoading").hidden = true;
    $("blogCrumbTitle").textContent = a.title;
    $("blogTitle").textContent = a.title;
    if (a.category) {
      var tag = $("blogCategory");
      tag.textContent = a.category; tag.hidden = false;
      tag.href = "blog.html?kategorie=" + encodeURIComponent(a.category);
    }
    var meta = $("blogMeta");
    meta.appendChild(el("span", null, formatDate(a.publishedAt)));
    meta.appendChild(el("span", null, "· " + a.readingMinutes + " Min. Lesezeit"));
    if (a.authorName) meta.appendChild(el("span", null, "· von " + a.authorName));

    if (a.coverUrl) {
      var fig = $("blogCover");
      var img = fig.querySelector("img");
      img.src = sized(a.coverUrl, 1200);
      img.srcset = [480, 800, 1200, 1600].map(function (w) { return sized(a.coverUrl, w) + " " + w + "w"; }).join(", ");
      img.sizes = "(max-width: 1000px) 100vw, 1000px";
      img.alt = a.coverAlt || "";
      fig.hidden = false;
    }

    // Le contenu a été assaini côté serveur (liste blanche) avant d'être enregistré.
    $("blogContent").innerHTML = a.content;

    if (related && related.length) {
      var grid = $("blogRelatedGrid");
      related.forEach(function (r) {
        var card = el("a", "blog-card");
        card.href = "blog-artikel.html?slug=" + encodeURIComponent(r.slug);
        var media = el("div", "blog-card__media" + (r.coverUrl ? "" : " blog-card__media--empty"));
        if (r.coverUrl) {
          var im = document.createElement("img");
          im.src = sized(r.coverUrl, 640); im.alt = r.coverAlt || ""; im.loading = "lazy"; im.decoding = "async";
          media.appendChild(im);
        }
        card.appendChild(media);
        var body = el("div", "blog-card__body");
        if (r.category) body.appendChild(el("span", "blog-card__tag", r.category));
        body.appendChild(el("h3", "blog-card__title", r.title));
        body.appendChild(el("p", "blog-card__excerpt", r.excerpt));
        card.appendChild(body);
        grid.appendChild(card);
      });
      $("blogRelated").hidden = false;
    }
    $("blogArticle").hidden = false;
    applySeo(a);
  }

  function notFound() {
    $("blogLoading").hidden = true;
    $("blogNotFound").hidden = false;
    document.title = "Artikel nicht gefunden | K&S Finanzberatung";
    setMeta('meta[name="robots"]', "content", "noindex, nofollow"); // une page d'erreur ne doit jamais être indexée
  }

  function init() {
    var slug = (new URLSearchParams(location.search).get("slug") || "").trim();
    if (!/^[a-z0-9-]+$/.test(slug)) { notFound(); return; }
    fetch(getApiBase() + "/api/blog/articles/" + encodeURIComponent(slug))
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok || !res.d.success) { notFound(); return; }
        render(res.d.data.article, res.d.data.related);
      })
      .catch(function () {
        $("blogLoading").textContent = "Der Artikel konnte gerade nicht geladen werden. Bitte versuchen Sie es später erneut.";
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
