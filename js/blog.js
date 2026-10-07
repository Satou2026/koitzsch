(function () {
  "use strict";

  var PAGE_SIZE = 9;
  var state = { page: 1, categorie: "", search: "" };
  var searchTimer = null;

  function getApiBase() {
    return window.BlitzNotify && window.BlitzNotify.getApiBase ? window.BlitzNotify.getApiBase() : "https://api.blitzleihen.com";
  }
  function $(id) { return document.getElementById(id); }

  // "2026-10-04 17:39:20" (heure serveur) -> Date
  function parseDate(s) { return s ? new Date(String(s).replace(" ", "T")) : null; }
  function formatDate(s) {
    var d = parseDate(s);
    return d && !isNaN(d) ? d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" }) : "";
  }
  // Variantes Cloudinary plus légères pour les vignettes
  function thumb(url, w) { return url.replace(/\/(f_auto,q_auto(?:,c_limit)?),w_\d+\//, "/$1,w_" + w + "/"); }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function renderCard(a) {
    var card = el("a", "blog-card");
    card.href = "blog-artikel.html?slug=" + encodeURIComponent(a.slug);

    var media = el("div", "blog-card__media" + (a.coverUrl ? "" : " blog-card__media--empty"));
    if (a.coverUrl) {
      var img = document.createElement("img");
      img.src = thumb(a.coverUrl, 640);
      img.srcset = thumb(a.coverUrl, 480) + " 480w, " + thumb(a.coverUrl, 800) + " 800w, " + thumb(a.coverUrl, 1200) + " 1200w";
      img.sizes = "(max-width: 700px) 100vw, 360px";
      img.alt = a.coverAlt || "";
      img.loading = "lazy"; img.decoding = "async"; img.width = 16; img.height = 9;
      media.appendChild(img);
    }
    card.appendChild(media);

    var body = el("div", "blog-card__body");
    if (a.category) body.appendChild(el("span", "blog-card__tag", a.category));
    body.appendChild(el("h2", "blog-card__title", a.title));
    body.appendChild(el("p", "blog-card__excerpt", a.excerpt));
    var meta = el("div", "blog-card__meta");
    meta.appendChild(el("span", null, formatDate(a.publishedAt)));
    meta.appendChild(el("span", null, "· " + a.readingMinutes + " Min. Lesezeit"));
    body.appendChild(meta);
    card.appendChild(body);
    return card;
  }

  function renderFilters(categories) {
    var box = $("blogFilters");
    box.innerHTML = "";
    if (!categories.length) return;
    function chip(label, value) {
      var b = el("button", "blog-chip", label);
      b.type = "button";
      b.setAttribute("aria-pressed", String(state.categorie === value));
      b.addEventListener("click", function () { state.categorie = value; state.page = 1; load(); });
      box.appendChild(b);
    }
    chip("Alle", "");
    categories.forEach(function (c) { chip(c.name + " (" + c.count + ")", c.name); });
  }

  function renderPagination(p) {
    var nav = $("blogPagination");
    nav.innerHTML = "";
    if (p.pages <= 1) return;
    function btn(label, page, opts) {
      var b = el("button", null, label);
      b.type = "button";
      if (opts && opts.disabled) b.disabled = true;
      if (opts && opts.current) b.setAttribute("aria-current", "page");
      b.addEventListener("click", function () { state.page = page; load(); window.scrollTo({ top: 0, behavior: "smooth" }); });
      nav.appendChild(b);
    }
    btn("‹", p.page - 1, { disabled: p.page <= 1 });
    for (var i = 1; i <= p.pages; i++) btn(String(i), i, { current: i === p.page });
    btn("›", p.page + 1, { disabled: p.page >= p.pages });
  }

  function syncUrl() {
    var q = new URLSearchParams();
    if (state.categorie) q.set("kategorie", state.categorie);
    if (state.search) q.set("suche", state.search);
    if (state.page > 1) q.set("seite", String(state.page));
    var qs = q.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
  }

  function load() {
    var grid = $("blogGrid"), loading = $("blogLoading"), empty = $("blogEmpty");
    loading.hidden = false; empty.hidden = true; grid.hidden = true;
    var q = new URLSearchParams({ page: String(state.page), limit: String(PAGE_SIZE) });
    if (state.categorie) q.set("categorie", state.categorie);
    if (state.search) q.set("search", state.search);
    syncUrl();

    fetch(getApiBase() + "/api/blog/articles?" + q.toString())
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        loading.hidden = true;
        if (!res.ok || !res.d.success) throw new Error("api");
        var data = res.d.data;
        renderFilters(data.categories || []);
        grid.innerHTML = "";
        if (!data.articles.length) {
          empty.hidden = false;
          empty.textContent = (state.categorie || state.search)
            ? "Keine Artikel für diese Auswahl gefunden."
            : "Hier erscheinen bald unsere ersten Artikel.";
          renderPagination({ pages: 0 });
          return;
        }
        data.articles.forEach(function (a) { grid.appendChild(renderCard(a)); });
        grid.hidden = false;
        renderPagination(data.pagination);
      })
      .catch(function () {
        loading.hidden = true; empty.hidden = false;
        empty.textContent = "Die Artikel konnten gerade nicht geladen werden. Bitte versuchen Sie es später erneut.";
      });
  }

  function init() {
    var q = new URLSearchParams(location.search);
    state.categorie = q.get("kategorie") || "";
    state.search = q.get("suche") || "";
    state.page = Math.max(1, parseInt(q.get("seite"), 10) || 1);
    var input = $("blogSearch");
    input.value = state.search;
    input.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { state.search = input.value.trim(); state.page = 1; load(); }, 300);
    });
    load();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
