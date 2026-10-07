/**
 * BlitzBlogEditor — éditeur d'articles WYSIWYG, sans dépendance externe.
 * Partagé par l'espace administrateur web (espace-admin/admin/blog.html) et
 * le PWA (admin-mobile/). Une copie identique de ce fichier est servie par
 * admin-mobile/ pour que le PWA reste autonome et utilisable hors-ligne.
 *
 * Principe : l'auteur met en forme avec une barre d'outils (titres, gras,
 * listes, encadrés, images, boutons...) et ne voit jamais de HTML. Les blocs
 * correspondent exactement à la liste blanche du serveur
 * (lib/html_sanitizer.php) : ce qui est possible ici est ce que le serveur
 * accepte. Le serveur reste l'unique autorité de sécurité ; le nettoyage
 * côté navigateur (cleanHtml) n'est qu'un confort (collage depuis Word...).
 *
 * Usage :
 *   var ed = BlitzBlogEditor.create({
 *     mount: element,
 *     uploadImage: function (file) { return Promise.resolve({url, width, height}); },
 *     onChange: function () {},
 *     notify: function (message, type) {}   // type: "error" | "info"
 *   });
 *   ed.setHtml(html); ed.getHtml(); ed.isDirty(); ed.markClean(); ed.getIssues();
 */
(function (global) {
  "use strict";

  // ---------------------------------------------------------------- liste blanche (miroir du serveur)
  var TAGS = {
    p: ["blog-lead"], h2: [], h3: [], h4: [], strong: [], em: [], u: [], br: [], hr: [], ul: [], ol: [], li: [],
    blockquote: [], a: ["blog-btn"], img: [], figure: ["blog-figure", "blog-figure--wide"], figcaption: [],
    aside: ["blog-callout", "blog-callout--tip", "blog-callout--warning"],
    table: [], thead: [], tbody: [], tr: [], th: [], td: []
  };
  var ATTRS = {
    a: ["href", "title", "target", "rel"], img: ["src", "alt", "width", "height"], th: ["colspan", "rowspan"], td: ["colspan", "rowspan"]
  };
  var ALIASES = { b: "strong", i: "em", h1: "h2", h5: "h4", h6: "h4", strike: "u", s: "u", del: "u" };
  var DROP = ["script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math", "form", "input",
    "button", "textarea", "select", "option", "link", "meta", "head", "title", "base", "audio", "video", "canvas", "xml"];

  function safeHref(href) {
    var probe = String(href || "").replace(/[\u0000-\u0020\u007f-\u009f]+/g, "");
    if (!probe) return null;
    var m = probe.match(/^([a-z][a-z0-9+.\-]*):/i);
    if (m) return /^(https?|mailto|tel)$/i.test(m[1]) ? href.trim() : null;
    if (probe.indexOf("//") === 0) return null;
    return href.trim();
  }

  /** Nettoie un fragment HTML (collage, chargement). Retourne une chaîne HTML. */
  function cleanHtml(html) {
    var doc = new DOMParser().parseFromString("<body>" + String(html || "") + "</body>", "text/html");
    var body = doc.body;
    (function walk(parent) {
      Array.prototype.slice.call(parent.childNodes).forEach(function (node) {
        if (node.nodeType === 8) { parent.removeChild(node); return; }
        if (node.nodeType !== 1) return;
        var tag = node.nodeName.toLowerCase();
        if (ALIASES[tag]) {
          var renamed = doc.createElement(ALIASES[tag]);
          while (node.firstChild) renamed.appendChild(node.firstChild);
          parent.replaceChild(renamed, node);
          node = renamed; tag = ALIASES[tag];
        }
        if (DROP.indexOf(tag) !== -1) { parent.removeChild(node); return; }
        if (!Object.prototype.hasOwnProperty.call(TAGS, tag)) {
          walk(node);
          while (node.firstChild) parent.insertBefore(node.firstChild, node);
          parent.removeChild(node);
          return;
        }
        Array.prototype.slice.call(node.attributes).forEach(function (attr) {
          var name = attr.name.toLowerCase();
          if (name === "class") {
            var keep = attr.value.split(/\s+/).filter(function (c) { return TAGS[tag].indexOf(c) !== -1; });
            if (keep.length) node.setAttribute("class", keep.join(" ")); else node.removeAttribute("class");
          } else if ((ATTRS[tag] || []).indexOf(name) === -1) {
            node.removeAttribute(attr.name);
          } else if (name === "href") {
            var h = safeHref(attr.value);
            if (h === null) node.removeAttribute("href"); else node.setAttribute("href", h);
          } else if (name === "src") {
            if (!/^https:\/\//i.test(attr.value)) node.removeAttribute("src");
          }
        });
        if (tag === "img" && !node.getAttribute("src")) { parent.removeChild(node); return; }
        if (tag === "img") node.removeAttribute("draggable");
        if (tag === "a" && !node.getAttribute("href")) {
          while (node.firstChild) parent.insertBefore(node.firstChild, node);
          parent.removeChild(node); return;
        }
        walk(node);
      });
    })(body);
    // blocs vides
    Array.prototype.slice.call(body.querySelectorAll("p,h2,h3,h4,li,blockquote,figcaption,aside")).forEach(function (el) {
      if (!el.textContent.replace(/\u00a0/g, " ").trim() && !el.querySelector("img")) el.parentNode.removeChild(el);
    });
    return body.innerHTML.trim();
  }

  // ---------------------------------------------------------------- styles (isolés, préfixe bbe-)
  var CSS = [
    ".bbe{border:1px solid #cfd6e4;border-radius:12px;background:#fff;color:#1d2433;font:16px/1.65 'DM Sans',system-ui,-apple-system,Segoe UI,sans-serif;overflow:hidden;display:flex;flex-direction:column}",
    ".bbe *{box-sizing:border-box}",
    ".bbe-toolbar{display:flex;gap:4px;align-items:center;padding:8px;background:#f3f5fa;border-bottom:1px solid #dde2ee;overflow-x:auto;-webkit-overflow-scrolling:touch;position:sticky;top:0;z-index:5;scrollbar-width:thin}",
    ".bbe-sep{width:1px;height:24px;background:#cfd6e4;margin:0 4px;flex:0 0 auto}",
    ".bbe-btn{flex:0 0 auto;min-width:38px;height:38px;padding:0 10px;border:1px solid #cfd6e4;border-radius:8px;background:#fff;color:#1d2433;font:600 14px/1 inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;-webkit-tap-highlight-color:transparent}",
    ".bbe-btn:hover{background:#eaf0fb}.bbe-btn:active{transform:scale(.96)}",
    ".bbe-btn.is-on{background:#0b2d59;color:#fff;border-color:#0b2d59}",
    ".bbe-btn[disabled]{opacity:.45;cursor:default}",
    ".bbe-select{flex:0 0 auto;height:38px;border:1px solid #cfd6e4;border-radius:8px;background:#fff;color:#1d2433;font:600 14px inherit;padding:0 8px;max-width:170px}",
    ".bbe-pop{display:none;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 12px;background:#fff8e1;border-bottom:1px solid #f0dca0;font-size:14px}",
    ".bbe-pop.is-open{display:flex}",
    ".bbe-pop label{font-weight:600;font-size:13px;color:#5a4a00}",
    ".bbe-pop input{flex:0 0 auto;width:100%;min-width:0;height:38px;border:1px solid #cfb86a;border-radius:8px;padding:0 10px;font:inherit;background:#fff;color:#1d2433}",
    ".bbe-pop .bbe-btn{height:36px}",
    ".bbe-status{font-size:13px;color:#5a4a00}",
    ".bbe-area{padding:18px 18px 26px;min-height:320px;outline:none;color:#1d2433;overflow-wrap:anywhere}",
    ".bbe-area:empty::before,.bbe-area:has(> p:only-child > br:only-child)::before{content:attr(data-placeholder);color:#8a93b2;pointer-events:none}",
    ".bbe-area p{margin:0 0 1em}",
    ".bbe-area h2{font-size:1.6em;line-height:1.25;margin:1.4em 0 .5em;color:#0b2d59}",
    ".bbe-area h3{font-size:1.25em;line-height:1.3;margin:1.2em 0 .4em;color:#0b2d59}",
    ".bbe-area h4{font-size:1.05em;margin:1em 0 .4em}",
    ".bbe-area p.blog-lead{font-size:1.2em;line-height:1.55;color:#3a4560}",
    ".bbe-area a{color:#1a5fb4;text-decoration:underline}",
    ".bbe-area a.blog-btn{display:inline-block;background:#c8a84b;color:#0b2d59;padding:10px 20px;border-radius:8px;font-weight:700;text-decoration:none}",
    ".bbe-area ul,.bbe-area ol{margin:0 0 1em;padding-left:1.4em}",
    ".bbe-area blockquote{margin:1.2em 0;padding:.6em 1em;border-left:4px solid #c8a84b;background:#faf6e9;color:#3a4560}",
    ".bbe-area blockquote p:last-child{margin-bottom:0}",
    ".bbe-area hr{border:0;border-top:2px solid #e3e7f0;margin:1.6em 0}",
    ".bbe-area aside{margin:1.2em 0;padding:.9em 1.1em;border-radius:10px;border-left:5px solid #1a5fb4;background:#eaf2fd}",
    ".bbe-area aside.blog-callout--tip{border-left-color:#1a7a4a;background:#e8f6ee}",
    ".bbe-area aside.blog-callout--warning{border-left-color:#c8831a;background:#fdf1de}",
    ".bbe-area aside p:last-child{margin-bottom:0}",
    ".bbe-area figure{margin:1.4em 0;text-align:center}",
    ".bbe-area figure img{max-width:100%;height:auto;border-radius:10px;cursor:pointer}",
    ".bbe-area figure.bbe-selected img{outline:3px solid #1a5fb4;outline-offset:2px}",
    ".bbe-area figure.blog-figure--wide{margin-left:-8px;margin-right:-8px}",
    ".bbe-area figcaption{font-size:.88em;color:#5d6785;margin-top:.5em;min-height:1.2em}",
    ".bbe-area figcaption:empty::before,.bbe-area figcaption:has(> br:only-child)::before{content:'Bildunterschrift (optional)';color:#aab1c8}",
    ".bbe-foot{display:flex;justify-content:space-between;gap:10px;padding:8px 14px;background:#f3f5fa;border-top:1px solid #dde2ee;font-size:12px;color:#5d6785}"
  ].join("\n");

  function injectCss() {
    if (document.getElementById("bbe-css")) return;
    var st = document.createElement("style");
    st.id = "bbe-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ---------------------------------------------------------------- éditeur
  function create(opts) {
    injectCss();
    var mount = opts.mount;
    var uploadImage = opts.uploadImage;
    var dirty = false;
    var lastRange = null;
    var selectedFigure = null;
    var popMode = null;

    mount.innerHTML = "";
    var root = el("div", "bbe");
    var toolbar = el("div", "bbe-toolbar");
    var pop = el("div", "bbe-pop");
    var area = el("div", "bbe-area");
    var foot = el("div", "bbe-foot", "<span class='bbe-count'></span><span class='bbe-hint'>Tipp: Bild antippen zum Bearbeiten</span>");
    area.contentEditable = "true";
    area.setAttribute("data-placeholder", opts.placeholder || "Hier schreiben Sie Ihren Artikel …");
    area.setAttribute("spellcheck", "true");
    area.setAttribute("lang", "de");
    root.appendChild(toolbar); root.appendChild(pop); root.appendChild(area); root.appendChild(foot);
    mount.appendChild(root);

    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (e) { /* ignoré */ }

    // ---------- barre d'outils
    var fileInput = el("input");
    fileInput.type = "file"; fileInput.accept = "image/jpeg,image/png,image/webp,image/gif"; fileInput.style.display = "none";
    root.appendChild(fileInput);

    var blockSelect = el("select", "bbe-select");
    blockSelect.setAttribute("aria-label", "Absatzformat");
    [
      ["p", "Absatz"], ["lead", "Einleitung (groß)"], ["h2", "Überschrift"], ["h3", "Zwischenüberschrift"],
      ["quote", "Zitat"], ["callout", "Hinweis-Box (blau)"], ["tip", "Tipp-Box (grün)"], ["warning", "Warn-Box (orange)"]
    ].forEach(function (o) { var opt = el("option"); opt.value = o[0]; opt.textContent = o[1]; blockSelect.appendChild(opt); });
    toolbar.appendChild(blockSelect);

    var buttons = {};
    function addBtn(key, label, title, handler, extraCls) {
      var b = el("button", "bbe-btn" + (extraCls ? " " + extraCls : ""), label);
      b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
      b.addEventListener("mousedown", function (e) { e.preventDefault(); }); // garde la sélection dans le texte
      b.addEventListener("click", function (e) { e.preventDefault(); handler(); });
      toolbar.appendChild(b);
      buttons[key] = b;
      return b;
    }
    function sep() { toolbar.appendChild(el("span", "bbe-sep")); }

    sep();
    addBtn("bold", "<b>G</b>", "Fett (Strg+B)", function () { exec("bold"); });
    addBtn("italic", "<i>K</i>", "Kursiv (Strg+I)", function () { exec("italic"); });
    addBtn("underline", "<u>U</u>", "Unterstrichen (Strg+U)", function () { exec("underline"); });
    sep();
    addBtn("ul", "• Liste", "Aufzählung", function () { exec("insertUnorderedList"); });
    addBtn("ol", "1. Liste", "Nummerierte Liste", function () { exec("insertOrderedList"); });
    sep();
    addBtn("link", "🔗 Link", "Link einfügen / bearbeiten", openLinkPop);
    addBtn("image", "🖼 Bild", "Bild einfügen", function () { saveRange(); fileInput.click(); });
    addBtn("button", "🔘 Button", "Button (Handlungsaufforderung) einfügen", openButtonPop);
    addBtn("hr", "— Linie", "Trennlinie", function () { restoreRange(); exec("insertHorizontalRule"); });
    sep();
    addBtn("undo", "↶", "Rückgängig (Strg+Z)", function () { exec("undo"); });
    addBtn("redo", "↷", "Wiederholen (Strg+Y)", function () { exec("redo"); });
    addBtn("clear", "✕ Format", "Formatierung entfernen", function () { restoreRange(); exec("removeFormat"); exec("unlink"); });

    // ---------- sélection
    function inArea(node) { return node && (node === area || area.contains(node)); }
    function saveRange() {
      var s = window.getSelection();
      if (s && s.rangeCount && inArea(s.anchorNode)) lastRange = s.getRangeAt(0).cloneRange();
    }
    function restoreRange() {
      area.focus();
      if (lastRange) {
        var s = window.getSelection();
        s.removeAllRanges(); s.addRange(lastRange);
      }
    }
    function anchorElement() {
      var s = window.getSelection();
      var n = s && s.rangeCount ? s.anchorNode : null;
      if (!n || !inArea(n)) return null;
      return n.nodeType === 1 ? n : n.parentElement;
    }
    function closest(node, sel) {
      while (node && node !== area) { if (node.matches && node.matches(sel)) return node; node = node.parentElement; }
      return null;
    }
    function topBlock(node) {
      while (node && node.parentElement !== area) node = node.parentElement;
      return node && node.parentElement === area ? node : null;
    }
    function changed() { dirty = true; updateStats(); if (opts.onChange) opts.onChange(); }
    function exec(cmd, val) {
      area.focus();
      document.execCommand(cmd, false, val == null ? null : val);
      saveRange(); changed(); updateState();
    }
    function notify(msg, type) { if (opts.notify) opts.notify(msg, type || "info"); else if (type === "error") window.alert(msg); }

    // ---------- formats de bloc
    // Les conversions de blocs entiers se font directement dans le DOM : execCommand("insertHTML") de
    // Chrome/Safari fusionne le premier bloc inséré dans le bloc voisin et supprime <aside>/<figure>.
    function htmlToFragment(html) {
      var t = document.createElement("template");
      t.innerHTML = html;
      return t.content;
    }
    function replaceNodeHtml(node, html) {
      var frag = htmlToFragment(html);
      var last = frag.lastElementChild;
      node.parentNode.replaceChild(frag, node);
      if (last) placeCaret(last, false);
    }
    function unwrapNode(node) {
      var parent = node.parentNode, lastChild = node.lastChild;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
      if (lastChild) placeCaret(lastChild.nodeType === 1 ? lastChild : lastChild.parentNode, false);
    }
    function currentKind() {
      var n = anchorElement();
      if (!n) return "p";
      var aside = closest(n, "aside");
      if (aside) return aside.classList.contains("blog-callout--tip") ? "tip" : aside.classList.contains("blog-callout--warning") ? "warning" : "callout";
      if (closest(n, "blockquote")) return "quote";
      if (closest(n, "h2")) return "h2";
      if (closest(n, "h3") || closest(n, "h4")) return "h3";
      if (closest(n, "p.blog-lead")) return "lead";
      return "p";
    }
    function applyBlock(kind) {
      restoreRange();
      var n = anchorElement();
      if (!n) return;
      var aside = closest(n, "aside");
      var bq = closest(n, "blockquote");
      var isBox = kind === "callout" || kind === "tip" || kind === "warning";
      var boxCls = { callout: "blog-callout", tip: "blog-callout blog-callout--tip", warning: "blog-callout blog-callout--warning" };

      if (isBox) {
        if (aside) { aside.className = boxCls[kind]; changed(); updateState(); return; }
        var blk = closest(n, "p,h2,h3,h4") || topBlock(n);
        if (!blk) return;
        var inner = (blk.tagName === "P") ? blk.innerHTML : blk.textContent;
        replaceNodeHtml(blk, '<aside class="' + boxCls[kind] + '"><p>' + (inner || "<br>") + "</p></aside>");
      } else {
        if (aside) { unwrapNode(aside); }
        else if (bq && kind !== "quote") { unwrapNode(bq); }
        if (kind === "quote") {
          if (bq) unwrapNode(bq); else document.execCommand("formatBlock", false, "<blockquote>");
        } else if (kind === "h2" || kind === "h3") {
          document.execCommand("formatBlock", false, "<" + kind + ">");
        } else { // p / lead
          document.execCommand("formatBlock", false, "<p>");
          var p = closest(anchorElement(), "p");
          if (p) { p.removeAttribute("class"); if (kind === "lead") p.className = "blog-lead"; }
        }
      }
      saveRange(); changed(); updateState();
    }
    blockSelect.addEventListener("change", function () { applyBlock(blockSelect.value); });

    // ---------- insertion de blocs entiers (image, bouton)
    function insertBlockAfterCurrent(html) {
      restoreRange();
      var n = anchorElement();
      var top = n ? topBlock(n) : null;
      var frag = htmlToFragment(html);
      var last = frag.lastElementChild;
      if (top && top.tagName === "P" && !top.textContent.trim() && !top.querySelector("img")) {
        top.parentNode.replaceChild(frag, top);
      } else if (top) {
        top.parentNode.insertBefore(frag, top.nextSibling);
      } else {
        area.appendChild(frag);
      }
      if (last) placeCaret(last, false);
      saveRange(); changed();
    }

    // ---------- fenêtre contextuelle (lien, bouton, image)
    function closePop() {
      pop.classList.remove("is-open"); pop.innerHTML = ""; popMode = null;
      if (selectedFigure) { selectedFigure.classList.remove("bbe-selected"); selectedFigure = null; }
    }
    function openPop(mode, build) {
      saveRange();
      pop.innerHTML = ""; popMode = mode;
      build(pop);
      pop.classList.add("is-open");
      var first = pop.querySelector("input");
      if (first) setTimeout(function () { first.focus(); }, 0);
    }
    function popInput(parent, label, value, placeholder, type) {
      var wrap = el("span"); wrap.style.cssText = "display:flex;flex-direction:column;gap:2px;flex:1 1 180px;min-width:0";
      wrap.appendChild(el("label", null, label));
      var inp = el("input"); inp.type = type || "text"; inp.value = value || ""; inp.placeholder = placeholder || "";
      wrap.appendChild(inp); parent.appendChild(wrap);
      return inp;
    }
    function popBtn(parent, label, handler, cls) {
      var b = el("button", "bbe-btn " + (cls || ""), label); b.type = "button";
      b.addEventListener("click", function (e) { e.preventDefault(); handler(); });
      parent.appendChild(b); return b;
    }
    function normalizeUrl(u) {
      u = String(u || "").trim();
      if (!u) return "";
      if (/^(https?:|mailto:|tel:|\/|#|\.\/|\.\.\/)/i.test(u)) return u;
      if (/^[\w\-\/]+\.html?([?#].*)?$/i.test(u)) return u; // page du site, ex. kreditantrag.html
      if (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(u)) return "mailto:" + u;
      if (/^[a-z][a-z0-9+.\-]*:/i.test(u)) return ""; // autre schéma : refusé
      if (/^[^\s\/]+\.[a-z]{2,}(\/.*)?$/i.test(u)) return "https://" + u; // domaine externe
      return ""; // mot isolé ou texte invalide
    }

    function openLinkPop() {
      var n = anchorElement();
      var existing = n ? closest(n, "a:not(.blog-btn)") : null;
      openPop("link", function (p) {
        var url = popInput(p, "Link-Adresse", existing ? existing.getAttribute("href") : "", "https://… oder kreditantrag.html", "url");
        var apply = function () {
          var href = normalizeUrl(url.value);
          if (!href) { notify("Bitte eine gültige Adresse eingeben.", "error"); return; }
          restoreRange();
          var s = window.getSelection();
          if (existing) { existing.setAttribute("href", href); changed(); }
          else if (s.isCollapsed) { document.execCommand("insertHTML", false, '<a href="' + href.replace(/"/g, "&quot;") + '">' + href.replace(/</g, "&lt;") + "</a>"); changed(); }
          else { document.execCommand("createLink", false, href); changed(); }
          closePop();
        };
        url.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); apply(); } });
        popBtn(p, "OK", apply, "is-on");
        if (existing) popBtn(p, "Link entfernen", function () { restoreRange(); exec("unlink"); closePop(); });
        popBtn(p, "✕", closePop);
      });
    }

    function openButtonPop() {
      openPop("button", function (p) {
        var label = popInput(p, "Button-Text", "", "z. B. Jetzt Kredit beantragen");
        var url = popInput(p, "Ziel", "kreditantrag.html", "kreditantrag.html", "url");
        popBtn(p, "Einfügen", function () {
          var href = normalizeUrl(url.value), txt = label.value.trim().replace(/</g, "&lt;");
          if (!txt || !href) { notify("Bitte Text und Ziel angeben.", "error"); return; }
          insertBlockAfterCurrent('<p><a class="blog-btn" href="' + href.replace(/"/g, "&quot;") + '">' + txt + "</a></p><p><br></p>");
          closePop();
        }, "is-on");
        popBtn(p, "✕", closePop);
      });
    }

    function openFigurePop(fig) {
      if (selectedFigure && selectedFigure !== fig) selectedFigure.classList.remove("bbe-selected");
      selectedFigure = fig; fig.classList.add("bbe-selected");
      var img = fig.querySelector("img");
      openPop("figure", function (p) {
        var alt = popInput(p, "Bildbeschreibung (Alt-Text) – wichtig für SEO & Barrierefreiheit", img.getAttribute("alt") || "", "z. B. Beraterin erklärt Kreditvertrag");
        var save = function () { img.setAttribute("alt", alt.value.trim()); changed(); };
        alt.addEventListener("input", save);
        alt.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); save(); closePop(); } });
        popBtn(p, fig.classList.contains("blog-figure--wide") ? "↔ Normal" : "↔ Breit", function () {
          fig.classList.toggle("blog-figure--wide"); changed(); openFigurePop(fig);
        });
        popBtn(p, "🗑 Entfernen", function () {
          var next = fig.nextElementSibling;
          fig.parentNode.removeChild(fig); closePop(); changed();
          if (!area.firstElementChild) setHtml("");
          if (next) { /* le curseur reste dans le texte */ }
        });
        popBtn(p, "Fertig", function () { save(); closePop(); }, "is-on");
      });
    }

    area.addEventListener("click", function (e) {
      var img = e.target && e.target.tagName === "IMG" ? e.target : null;
      var fig = img ? closest(img, "figure") : null;
      if (fig) { e.preventDefault(); openFigurePop(fig); }
      else if (popMode === "figure") closePop();
    });

    // ---------- images
    function uploadAndInsert(file) {
      if (!file || !/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { notify("Nur Bilder (JPG, PNG, WebP, GIF) sind erlaubt.", "error"); return; }
      if (file.size > 8 * 1024 * 1024) { notify("Das Bild ist zu groß (max. 8 MB).", "error"); return; }
      saveRange();
      pop.innerHTML = ""; pop.appendChild(el("span", "bbe-status", "⏳ Bild wird hochgeladen …")); pop.classList.add("is-open");
      Promise.resolve(uploadImage(file)).then(function (res) {
        closePop();
        var dims = res.width && res.height ? ' width="' + res.width + '" height="' + res.height + '"' : "";
        insertBlockAfterCurrent('<figure class="blog-figure"><img src="' + res.url + '" alt=""' + dims + "><figcaption></figcaption></figure><p><br></p>");
        var figs = area.querySelectorAll("figure");
        for (var i = 0; i < figs.length; i++) { if (figs[i].querySelector("img").getAttribute("src") === res.url) { openFigurePop(figs[i]); break; } }
      }).catch(function (err) {
        closePop(); notify((err && err.message) || "Upload fehlgeschlagen.", "error");
      });
    }
    fileInput.addEventListener("change", function () {
      var f = fileInput.files && fileInput.files[0]; fileInput.value = "";
      if (f) uploadAndInsert(f);
    });

    // ---------- collage / glisser-déposer
    area.addEventListener("paste", function (e) {
      var cd = e.clipboardData; if (!cd) return;
      var imgs = Array.prototype.filter.call(cd.files || [], function (f) { return /^image\//.test(f.type); });
      if (imgs.length) { e.preventDefault(); uploadAndInsert(imgs[0]); return; }
      var html = cd.getData("text/html");
      if (html) {
        e.preventDefault();
        document.execCommand("insertHTML", false, cleanHtml(html));
        saveRange(); changed();
      }
    });
    area.addEventListener("drop", function (e) {
      var files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length && /^image\//.test(files[0].type)) { e.preventDefault(); uploadAndInsert(files[0]); }
    });

    // ---------- touche Entrée : sortir d'une box / d'une légende
    area.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || e.shiftKey) return;
      var n = anchorElement(); if (!n) return;
      var cap = closest(n, "figcaption");
      if (cap) {
        e.preventDefault();
        var fig = closest(cap, "figure");
        var next = fig.nextElementSibling;
        if (!next || next.tagName !== "P") { next = el("p", null, "<br>"); fig.parentNode.insertBefore(next, fig.nextSibling); }
        placeCaret(next, true);
        return;
      }
      var p = closest(n, "p");
      var parent = p && p.parentElement;
      if (p && parent && (parent.tagName === "ASIDE" || parent.tagName === "BLOCKQUOTE") && !p.textContent.trim()) {
        e.preventDefault();
        var np = el("p", null, "<br>");
        parent.parentNode.insertBefore(np, parent.nextSibling);
        if (parent.children.length > 1) parent.removeChild(p);
        placeCaret(np, true);
        changed();
      }
    });
    function placeCaret(node, atStart) {
      var r = document.createRange(); r.selectNodeContents(node); r.collapse(!!atStart);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); lastRange = r.cloneRange();
    }

    // ---------- état de la barre d'outils + compteurs
    function updateState() {
      ["bold", "italic", "underline"].forEach(function (k) {
        var cmd = k;
        var on = false; try { on = document.queryCommandState(cmd); } catch (e) { /* ignoré */ }
        buttons[k].classList.toggle("is-on", !!on);
      });
      var n = anchorElement();
      buttons.ul.classList.toggle("is-on", !!(n && closest(n, "ul")));
      buttons.ol.classList.toggle("is-on", !!(n && closest(n, "ol")));
      if (n) blockSelect.value = currentKind();
    }
    function updateStats() {
      var words = (area.innerText || "").trim().split(/\s+/).filter(Boolean).length;
      foot.querySelector(".bbe-count").textContent = words + " Wörter · ca. " + Math.max(1, Math.ceil(words / 200)) + " Min. Lesezeit";
    }
    document.addEventListener("selectionchange", function () {
      var s = window.getSelection();
      if (s && s.rangeCount && inArea(s.anchorNode)) { saveRange(); updateState(); }
    });
    area.addEventListener("input", function () { saveRange(); changed(); });
    area.addEventListener("blur", saveRange);

    // ---------- API publique
    function setHtml(html) {
      var c = cleanHtml(html);
      area.innerHTML = c || "<p><br></p>";
      dirty = false; lastRange = null; closePop(); updateStats();
    }
    function getHtml() {
      var clone = area.cloneNode(true);
      Array.prototype.forEach.call(clone.querySelectorAll(".bbe-selected"), function (n) { n.classList.remove("bbe-selected"); });
      return cleanHtml(clone.innerHTML).replace(/&nbsp;/g, " ");
    }
    function getIssues() {
      var issues = [];
      var n = 0;
      Array.prototype.forEach.call(area.querySelectorAll("figure img"), function (i) { if (!(i.getAttribute("alt") || "").trim()) n++; });
      if (n) issues.push(n + (n === 1 ? " Bild hat" : " Bilder haben") + " keine Bildbeschreibung (Alt-Text).");
      return issues;
    }

    setHtml(opts.html || "");
    updateStats();

    return {
      el: root, area: area,
      getHtml: getHtml, setHtml: setHtml, getIssues: getIssues,
      isDirty: function () { return dirty; }, markClean: function () { dirty = false; },
      focus: function () { area.focus(); },
      getText: function () { return (area.innerText || "").trim(); },
      destroy: function () { mount.innerHTML = ""; }
    };
  }

  global.BlitzBlogEditor = { create: create, cleanHtml: cleanHtml };
})(window);
