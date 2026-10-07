/**
 * ContentModule — onglet « Inhalte » du PWA admin : modération des avis clients
 * et gestion du blog. Même API que l'espace administrateur web
 * (/api/admin/avis*, /api/admin/blog*), donc tout reste synchronisé.
 *
 * Chargé après le script principal de index.html (utilise les globales
 * App et I18N). Les libellés sont ajoutés au dictionnaire I18N existant (de/fr/en).
 */
(function () {
  "use strict";
  if (typeof App === "undefined" || typeof I18N === "undefined") return;

  // ------------------------------------------------------------------ i18n
  function L(key, de, fr, en) { I18N.dict[key] = { de: de, fr: fr, en: en }; }
  var t = function (k, r) { return I18N.t(k, r); };
  var esc = function (s) { return App.escapeHtml(s); };

  L("nav_inhalte", "Inhalte", "Contenus", "Content");
  L("cm_reviews", "Bewertungen", "Avis", "Reviews");
  L("cm_blog", "Blog", "Blog", "Blog");
  L("cm_f_pending", "Ausstehend", "En attente", "Pending");
  L("cm_f_approved", "Veröffentlicht", "Publiés", "Published");
  L("cm_f_rejected", "Abgelehnt", "Refusés", "Rejected");
  L("cm_f_hidden", "Versteckt", "Masqués", "Hidden");
  L("cm_f_all", "Alle", "Tous", "All");
  L("cm_f_draft", "Entwürfe", "Brouillons", "Drafts");
  L("cm_search_reviews", "Name, Kommentar, Referenz …", "Nom, commentaire, référence …", "Name, comment, reference …");
  L("cm_search_blog", "Titel oder Kategorie …", "Titre ou catégorie …", "Title or category …");
  L("cm_no_reviews", "Keine Bewertungen", "Aucun avis", "No reviews");
  L("cm_no_posts", "Noch keine Artikel", "Aucun article pour l'instant", "No articles yet");
  L("cm_new_post", "＋ Neuer Artikel", "＋ Nouvel article", "＋ New article");
  L("cm_status_pending", "Ausstehend", "En attente", "Pending");
  L("cm_status_approved", "Veröffentlicht", "Publié", "Published");
  L("cm_status_rejected", "Abgelehnt", "Refusé", "Rejected");
  L("cm_status_hidden", "Versteckt", "Masqué", "Hidden");
  L("cm_status_draft", "Entwurf", "Brouillon", "Draft");
  L("cm_status_published", "Veröffentlicht", "Publié", "Published");
  L("cm_review_title", "Bewertung", "Avis", "Review");
  L("cm_stars", "Sterne", "Étoiles", "Stars");
  L("cm_comment", "Kommentar", "Commentaire", "Comment");
  L("cm_consent_pub", "Zustimmung zur Veröffentlichung", "Accord de publication (site)", "Publication consent (site)");
  L("cm_consent_google", "Google-Einwilligung", "Consentement Google", "Google consent");
  L("cm_google_yes", "✅ Ja – möchte auch auf Google teilen", "✅ Oui – souhaite aussi publier sur Google", "✅ Yes – wants to share on Google too");
  L("cm_no", "— Nein", "— Non", "— No");
  L("cm_yes", "✅ Ja", "✅ Oui", "✅ Yes");
  L("cm_client_internal", "Kunde (intern, nie öffentlich)", "Client (interne, jamais publique)", "Customer (internal, never public)");
  L("cm_reference", "Antrag", "Dossier", "Application");
  L("cm_moderation", "Moderation", "Modération", "Moderation");
  L("cm_mod_info", "Eine Bewertung darf nicht allein deshalb abgelehnt oder ausgeblendet werden, weil sie kritisch ist (UWG, Google-Richtlinien). Für „Ablehnen“ und „Verstecken“ ist ein sachlicher Grund Pflicht.", "Un avis ne peut pas être refusé ou masqué au seul motif qu'il est critique (UWG, règles Google). Un motif objectif est obligatoire pour « Refuser » et « Masquer ».", "A review must not be rejected or hidden merely because it is critical (UWG, Google policy). An objective reason is required for “Reject” and “Hide”.");
  L("cm_reason", "Grund (Pflicht bei Ablehnen/Verstecken)", "Motif (obligatoire pour refuser/masquer)", "Reason (required to reject/hide)");
  L("cm_reason_pick", "— Grund wählen —", "— Choisir un motif —", "— Select a reason —");
  L("cm_reason_need", "Bitte zuerst einen Grund auswählen.", "Veuillez d'abord choisir un motif.", "Please select a reason first.");
  L("cm_r_spam", "Spam / gefälschte Bewertung", "Spam / faux avis", "Spam / fake review");
  L("cm_r_insulte", "Beleidigung / Rechtsverletzung", "Insulte / atteinte aux droits", "Abuse / legal violation");
  L("cm_r_pas_client", "Kein erkennbarer Kundenbezug", "Aucun lien avec un client", "No customer connection");
  L("cm_r_donnees_perso", "Enthält personenbezogene Daten Dritter", "Données personnelles de tiers", "Third-party personal data");
  L("cm_r_doublon", "Doppelte Bewertung", "Avis en double", "Duplicate review");
  L("cm_r_hors_sujet", "Kein Bezug zu unserer Leistung", "Hors sujet", "Off-topic");
  L("cm_r_autre", "Anderer Grund (Notiz erforderlich)", "Autre motif (note requise)", "Other (note required)");
  L("cm_note_ph", "Interne Notiz (nicht öffentlich) …", "Note interne (non publique) …", "Internal note (not public) …");
  L("cm_approve", "✅ Freigeben", "✅ Publier", "✅ Approve");
  L("cm_reject", "🚫 Ablehnen", "🚫 Refuser", "🚫 Reject");
  L("cm_hide", "🙈 Verstecken", "🙈 Masquer", "🙈 Hide");
  L("cm_back_pending", "⏳ Zurück zu Ausstehend", "⏳ Remettre en attente", "⏳ Back to pending");
  L("cm_delete", "🗑 Löschen", "🗑 Supprimer", "🗑 Delete");
  L("cm_delete_review_confirm", "Diese Bewertung wirklich endgültig löschen?", "Supprimer définitivement cet avis ?", "Delete this review permanently?");
  L("cm_delete_post_confirm", "Diesen Artikel wirklich endgültig löschen?", "Supprimer définitivement cet article ?", "Delete this article permanently?");
  L("cm_saved", "Gespeichert", "Enregistré", "Saved");
  L("cm_error", "Fehler: {m}", "Erreur : {m}", "Error: {m}");
  L("cm_back", "← Zurück", "← Retour", "← Back");
  L("cm_unsaved", "Nicht gespeicherte Änderungen gehen verloren. Trotzdem schließen?", "Les modifications non enregistrées seront perdues. Fermer quand même ?", "Unsaved changes will be lost. Close anyway?");
  L("cm_f_title", "Titel *", "Titre *", "Title *");
  L("cm_f_category", "Kategorie", "Catégorie", "Category");
  L("cm_f_author", "Autor/in", "Auteur", "Author");
  L("cm_f_cover", "Titelbild", "Image de couverture", "Cover image");
  L("cm_f_cover_pick", "🖼 Bild wählen", "🖼 Choisir une image", "🖼 Choose image");
  L("cm_f_cover_remove", "Entfernen", "Retirer", "Remove");
  L("cm_f_cover_alt", "Bildbeschreibung (Alt-Text)", "Description de l'image (alt)", "Image description (alt)");
  L("cm_f_excerpt", "Kurzer Auszug", "Court extrait", "Short excerpt");
  L("cm_f_content", "Inhalt *", "Contenu *", "Content *");
  L("cm_f_seo", "🔎 Suchmaschinen (SEO)", "🔎 Moteurs de recherche (SEO)", "🔎 Search engines (SEO)");
  L("cm_f_slug", "Adresse (URL-Kürzel)", "Adresse (slug)", "Address (slug)");
  L("cm_f_metatitle", "SEO-Titel", "Titre SEO", "SEO title");
  L("cm_f_metadesc", "SEO-Beschreibung", "Description SEO", "SEO description");
  L("cm_save", "💾 Speichern", "💾 Enregistrer", "💾 Save");
  L("cm_publish", "🚀 Veröffentlichen", "🚀 Publier", "🚀 Publish");
  L("cm_unpublish", "Zurück zum Entwurf", "Repasser en brouillon", "Back to draft");
  L("cm_preview", "👁 Vorschau", "👁 Aperçu", "👁 Preview");
  L("cm_close", "Schließen", "Fermer", "Close");
  L("cm_title_needed", "Bitte einen Titel eingeben.", "Veuillez saisir un titre.", "Please enter a title.");
  L("cm_unpublish_confirm", "Der Artikel ist danach nicht mehr öffentlich sichtbar. Fortfahren?", "L'article ne sera plus visible publiquement. Continuer ?", "The article will no longer be publicly visible. Continue?");
  L("cm_publish_anyway", "Trotzdem veröffentlichen?", "Publier quand même ?", "Publish anyway?");
  L("cm_new_post_title", "Neuer Artikel", "Nouvel article", "New article");
  L("cm_edit_post_title", "Artikel bearbeiten", "Modifier l'article", "Edit article");
  L("cm_views", "Aufrufe", "vues", "views");
  L("cm_uploading", "⏳ Wird hochgeladen …", "⏳ Envoi en cours …", "⏳ Uploading …");

  // ------------------------------------------------------------------ styles
  var CSS = [
    ".cm-seg{display:flex;gap:6px;background:var(--navy-mid);border:1px solid var(--border);border-radius:12px;padding:4px;margin-bottom:14px}",
    ".cm-seg button{flex:1;border:0;background:transparent;color:var(--muted);font:600 14px var(--f-body);padding:10px 8px;border-radius:9px;cursor:pointer;display:flex;gap:6px;align-items:center;justify-content:center}",
    ".cm-seg button.active{background:var(--gold);color:var(--navy)}",
    ".cm-count{background:var(--abgelehnt);color:#fff;border-radius:9px;min-width:18px;height:18px;padding:0 5px;font-size:11px;display:none;align-items:center;justify-content:center}",
    ".cm-count.show{display:inline-flex}",
    ".cm-pill{display:inline-block;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}",
    ".cm-pill--pending,.cm-pill--draft{background:rgba(245,158,11,.18);color:#f59e0b}",
    ".cm-pill--approved,.cm-pill--published{background:rgba(34,197,94,.18);color:#22c55e}",
    ".cm-pill--rejected{background:rgba(239,68,68,.18);color:#ef4444}",
    ".cm-pill--hidden{background:rgba(255,255,255,.12);color:var(--muted)}",
    ".cm-stars{color:var(--gold);letter-spacing:1px}",
    ".cm-thumb{width:48px;height:48px;border-radius:10px;object-fit:cover;background:var(--navy-card);flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:20px}",
    ".cm-new{width:100%;margin-bottom:12px}",
    ".cm-note{font-size:12px;color:var(--muted);background:rgba(255,255,255,.05);border-radius:10px;padding:10px 12px;margin:8px 0 12px;line-height:1.5}",
    ".cm-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}",
    ".cm-actions .btn-action{margin:0}",
    ".cm-danger{color:#ef4444!important;border-color:rgba(239,68,68,.4)!important}",
    /* éditeur plein écran */
    ".cm-view-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px 14px 24px}",
    ".cm-view-body .form-group{margin-bottom:14px}",
    ".cm-hint{font-size:11px;color:var(--muted);margin-top:4px;display:flex;justify-content:space-between}",
    ".cm-hint .over{color:#ef4444;font-weight:700}",
    ".cm-cover{display:flex;gap:10px;align-items:center;flex-wrap:wrap}",
    ".cm-cover img{width:110px;aspect-ratio:16/9;object-fit:cover;border-radius:8px;border:1px solid var(--border)}",
    ".cm-details{border:1px solid var(--border);border-radius:12px;margin:6px 0 14px}",
    ".cm-details summary{padding:12px 14px;font-weight:700;cursor:pointer;color:var(--gold)}",
    ".cm-details > div{padding:0 14px 6px}",
    ".cm-bar{flex-shrink:0;display:flex;gap:8px;padding:10px 12px calc(10px + var(--safe-bottom));background:var(--navy);border-top:1px solid var(--border)}",
    ".cm-bar button{flex:1;margin:0;padding:12px 6px;font-size:13px}",
    ".cm-preview{position:fixed;inset:0;z-index:400;background:#fff;color:#1d2433;display:none;flex-direction:column}",
    ".cm-preview.open{display:flex}",
    ".cm-preview header{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:calc(var(--safe-top) + 10px) 14px 10px;background:var(--navy);color:#fff}",
    ".cm-preview .cm-pv-body{flex:1;overflow-y:auto;padding:16px}",
    ".cm-preview .cm-pv-body h1{font:700 26px/1.2 var(--f-head);color:#0b2d59;margin:0 0 8px}",
    ".cm-preview .cm-pv-body img.cover{width:100%;border-radius:10px;margin:8px 0 16px}",
    ".cm-preview .bbe{border:0;border-radius:0}"
  ].join("\n");
  var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);

  // ------------------------------------------------------------------ API
  async function req(path, method, body) {
    var headers = { Authorization: "Bearer " + App.token };
    if (body !== undefined && body !== null) headers["Content-Type"] = "application/json";
    var res = await fetch(App.getApiBase() + path, {
      method: method || "GET", headers: headers, body: (body !== undefined && body !== null) ? JSON.stringify(body) : undefined
    });
    if (res.status === 401) { App.logout(); throw new Error(t("session_expired")); }
    var j = {};
    try { j = await res.json(); } catch (e) { /* réponse non JSON */ }
    if (!res.ok || j.success === false) {
      var detail = j.errors ? " " + Object.keys(j.errors).map(function (k) { return j.errors[k]; }).join(" · ") : "";
      throw new Error((j.message || ("API " + res.status)) + detail);
    }
    return j;
  }
  async function uploadImage(file) {
    var fd = new FormData(); fd.append("file", file);
    var res = await fetch(App.getApiBase() + "/api/admin/blog/image", { method: "POST", headers: { Authorization: "Bearer " + App.token }, body: fd });
    if (res.status === 401) { App.logout(); throw new Error(t("session_expired")); }
    var j = await res.json();
    if (!res.ok || !j.success) throw new Error(j.message || "Upload fehlgeschlagen");
    return j.data;
  }
  function toast(msg, type) { App.showToast(msg, type || "success"); }
  function fail(e) { toast(t("cm_error", { m: e.message }), "error"); }

  var REASONS = ["spam", "insulte", "pas_client", "donnees_perso", "doublon", "hors_sujet", "autre"];
  function fmtDate(s) { if (!s) return "—"; var d = new Date(String(s).replace(" ", "T")); return isNaN(d) ? "—" : d.toLocaleDateString(I18N.current === "de" ? "de-DE" : I18N.current); }
  function stars(n) { n = parseInt(n, 10) || 0; return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }
  function slugify(s) {
    var map = { "ä": "ae", "ö": "oe", "ü": "ue", "Ä": "ae", "Ö": "oe", "Ü": "ue", "ß": "ss", "&": " und ", "€": " euro " };
    s = String(s).replace(/[äöüÄÖÜß&€]/g, function (c) { return map[c]; });
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
  }

  // ------------------------------------------------------------------ état
  var CM = window.ContentModule = {
    mode: "avis", avisFilter: "pending", blogFilter: "all",
    avis: [], posts: [], editor: null, current: null, coverUrl: "", slugTouched: false, built: false, avisSearch: "", blogSearch: "",
    currentAvisId: null
  };
  var $ = function (id) { return document.getElementById(id); };
  var timers = {};
  function debounce(key, fn) { clearTimeout(timers[key]); timers[key] = setTimeout(fn, 300); }

  // ------------------------------------------------------------------ squelette de l'onglet
  function build() {
    if (CM.built) return;
    CM.built = true;
    var host = $("tab-inhalte");
    host.innerHTML =
      '<div class="cm-seg" id="cmSeg">' +
      '<button data-mode="avis" class="active"><span data-i18n="cm_reviews">' + t("cm_reviews") + '</span><span class="cm-count" id="cmPendingBadge">0</span></button>' +
      '<button data-mode="blog"><span data-i18n="cm_blog">' + t("cm_blog") + "</span></button></div>" +

      '<div id="cmAvisPane">' +
      '<div class="search-bar"><span class="search-bar__icon">🔍</span><input type="search" id="cmAvisSearch" data-i18n-placeholder="cm_search_reviews" placeholder="' + esc(t("cm_search_reviews")) + '" autocomplete="off" /></div>' +
      '<div class="filter-pills" id="cmAvisPills">' +
      ["pending", "approved", "rejected", "hidden", "all"].map(function (f) {
        return '<button class="pill' + (f === CM.avisFilter ? " active" : "") + '" data-f="' + f + '" data-i18n="cm_f_' + f + '">' + t("cm_f_" + f) + "</button>";
      }).join("") + "</div>" +
      '<div id="cmAvisList" class="recentes-list"><div class="spinner"></div></div></div>' +

      '<div id="cmBlogPane" style="display:none;">' +
      '<button class="btn-save cm-new" id="cmBlogNew" data-i18n="cm_new_post">' + t("cm_new_post") + "</button>" +
      '<div class="search-bar"><span class="search-bar__icon">🔍</span><input type="search" id="cmBlogSearch" data-i18n-placeholder="cm_search_blog" placeholder="' + esc(t("cm_search_blog")) + '" autocomplete="off" /></div>' +
      '<div class="filter-pills" id="cmBlogPills">' +
      [["all", "cm_f_all"], ["published", "cm_f_approved"], ["draft", "cm_f_draft"]].map(function (f) {
        return '<button class="pill' + (f[0] === CM.blogFilter ? " active" : "") + '" data-f="' + f[0] + '" data-i18n="' + f[1] + '">' + t(f[1]) + "</button>";
      }).join("") + "</div>" +
      '<div id="cmBlogList" class="recentes-list"><div class="spinner"></div></div></div>';

    // tiroir de modération + éditeur plein écran + aperçu
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="drawer-overlay" id="cmReviewOverlay"></div>' +
      '<div class="drawer" id="cmReviewDrawer"><div class="drawer__handle"></div>' +
      '<div class="drawer__header"><span class="drawer__title" id="cmReviewTitle"></span><button class="drawer__close" id="cmReviewClose">×</button></div>' +
      '<div class="drawer__body" id="cmReviewBody"></div></div>' +

      '<div class="chat-view" id="cmBlogView">' +
      '<header class="chat-view__header"><button class="chat-view__back" id="cmBlogBack" aria-label="Zurück">←</button>' +
      '<div style="flex:1;font-weight:700;" id="cmBlogViewTitle"></div><span class="cm-pill" id="cmBlogStatusPill"></span></header>' +
      '<div class="cm-view-body" id="cmBlogBody">' +
      '<div class="form-group"><label class="form-label" data-i18n="cm_f_title">' + t("cm_f_title") + '</label><input class="form-input" id="cmTitle" maxlength="200" /></div>' +
      '<div class="form-group"><label class="form-label" data-i18n="cm_f_category">' + t("cm_f_category") + '</label><input class="form-input" id="cmCategory" maxlength="60" list="cmCatList" /><datalist id="cmCatList"></datalist></div>' +
      '<div class="form-group"><label class="form-label" data-i18n="cm_f_cover">' + t("cm_f_cover") + '</label>' +
      '<div class="cm-cover"><img id="cmCoverImg" alt="" style="display:none;" />' +
      '<button class="btn-action" id="cmCoverBtn" style="margin:0;" data-i18n="cm_f_cover_pick">' + t("cm_f_cover_pick") + "</button>" +
      '<button class="btn-action cm-danger" id="cmCoverRemove" style="margin:0;display:none;" data-i18n="cm_f_cover_remove">' + t("cm_f_cover_remove") + "</button>" +
      '<input type="file" id="cmCoverFile" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none;" /></div>' +
      '<input class="form-input" id="cmCoverAlt" maxlength="200" style="margin-top:8px;" data-i18n-placeholder="cm_f_cover_alt" placeholder="' + esc(t("cm_f_cover_alt")) + '" /></div>' +
      '<div class="form-group"><label class="form-label" data-i18n="cm_f_excerpt">' + t("cm_f_excerpt") + '</label><textarea class="reply-textarea" id="cmExcerpt" rows="3" maxlength="400"></textarea><div class="cm-hint"><span></span><span id="cmExcerptCount">0 / 400</span></div></div>' +
      '<div class="form-group"><label class="form-label" data-i18n="cm_f_content">' + t("cm_f_content") + '</label><div id="cmEditorMount"></div></div>' +
      '<details class="cm-details"><summary data-i18n="cm_f_seo">' + t("cm_f_seo") + "</summary><div>" +
      '<div class="form-group"><label class="form-label" data-i18n="cm_f_slug">' + t("cm_f_slug") + '</label><input class="form-input" id="cmSlug" maxlength="160" /></div>' +
      '<div class="form-group"><label class="form-label" data-i18n="cm_f_metatitle">' + t("cm_f_metatitle") + '</label><input class="form-input" id="cmMetaTitle" maxlength="100" /><div class="cm-hint"><span></span><span id="cmMetaTitleCount">0 / 60</span></div></div>' +
      '<div class="form-group"><label class="form-label" data-i18n="cm_f_metadesc">' + t("cm_f_metadesc") + '</label><textarea class="reply-textarea" id="cmMetaDesc" rows="3" maxlength="200"></textarea><div class="cm-hint"><span></span><span id="cmMetaDescCount">0 / 155</span></div></div>' +
      '<div class="form-group"><label class="form-label" data-i18n="cm_f_author">' + t("cm_f_author") + '</label><input class="form-input" id="cmAuthor" maxlength="100" /></div></div></details>' +
      '<button class="btn-action cm-danger" id="cmBlogDelete" style="display:none;" data-i18n="cm_delete">' + t("cm_delete") + "</button></div>" +
      '<div class="cm-bar"><button class="btn-action" id="cmBlogPreviewBtn" data-i18n="cm_preview">' + t("cm_preview") + "</button>" +
      '<button class="btn-action" id="cmBlogSave" data-i18n="cm_save">' + t("cm_save") + "</button>" +
      '<button class="btn-save" id="cmBlogPublish" data-i18n="cm_publish">' + t("cm_publish") + "</button>" +
      '<button class="btn-action" id="cmBlogUnpublish" style="display:none;" data-i18n="cm_unpublish">' + t("cm_unpublish") + "</button></div></div>" +

      '<div class="cm-preview" id="cmPreview"><header><strong data-i18n="cm_preview">' + t("cm_preview") + '</strong><button class="btn-action" id="cmPreviewClose" style="margin:0;" data-i18n="cm_close">' + t("cm_close") + '</button></header><div class="cm-pv-body" id="cmPreviewBody"></div></div>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    bind();
  }

  function bind() {
    $("cmSeg").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-mode]"); if (!b) return;
      CM.mode = b.dataset.mode;
      Array.prototype.forEach.call($("cmSeg").children, function (x) { x.classList.toggle("active", x === b); });
      $("cmAvisPane").style.display = CM.mode === "avis" ? "" : "none";
      $("cmBlogPane").style.display = CM.mode === "blog" ? "" : "none";
      CM.mode === "avis" ? loadAvis() : loadPosts();
    });
    $("cmAvisPills").addEventListener("click", function (e) {
      var b = e.target.closest(".pill"); if (!b) return;
      CM.avisFilter = b.dataset.f;
      Array.prototype.forEach.call($("cmAvisPills").children, function (x) { x.classList.toggle("active", x === b); });
      loadAvis();
    });
    $("cmBlogPills").addEventListener("click", function (e) {
      var b = e.target.closest(".pill"); if (!b) return;
      CM.blogFilter = b.dataset.f;
      Array.prototype.forEach.call($("cmBlogPills").children, function (x) { x.classList.toggle("active", x === b); });
      loadPosts();
    });
    $("cmAvisSearch").addEventListener("input", function () { CM.avisSearch = this.value.trim(); debounce("a", loadAvis); });
    $("cmBlogSearch").addEventListener("input", function () { CM.blogSearch = this.value.trim(); debounce("b", loadPosts); });
    $("cmBlogNew").addEventListener("click", function () { openPost(null); });

    $("cmReviewClose").addEventListener("click", closeReview);
    $("cmReviewOverlay").addEventListener("click", closeReview);

    $("cmBlogBack").addEventListener("click", closePost);
    $("cmBlogSave").addEventListener("click", function () { savePost(false).catch(function () {}); });
    $("cmBlogPublish").addEventListener("click", function () {
      var issues = CM.editor.getIssues();
      if (issues.length && !window.confirm(issues.join("\n") + "\n\n" + t("cm_publish_anyway"))) return;
      setPostStatus("published");
    });
    $("cmBlogUnpublish").addEventListener("click", function () { if (window.confirm(t("cm_unpublish_confirm"))) setPostStatus("draft"); });
    $("cmBlogPreviewBtn").addEventListener("click", previewPost);
    $("cmPreviewClose").addEventListener("click", function () { $("cmPreview").classList.remove("open"); });
    $("cmBlogDelete").addEventListener("click", deletePost);

    $("cmTitle").addEventListener("input", function () {
      if (!CM.slugTouched && (!CM.current || CM.current.status !== "published")) $("cmSlug").value = slugify(this.value);
    });
    $("cmSlug").addEventListener("input", function () { CM.slugTouched = true; });
    $("cmCoverBtn").addEventListener("click", function () { $("cmCoverFile").click(); });
    $("cmCoverRemove").addEventListener("click", function () { setCover(""); });
    $("cmCoverFile").addEventListener("change", function () {
      var f = this.files[0]; this.value = ""; if (!f) return;
      $("cmCoverBtn").textContent = t("cm_uploading");
      uploadImage(f).then(function (d) { setCover(d.url); }).catch(function (e) { fail(e); setCover(CM.coverUrl); });
    });
    [["cmExcerpt", "cmExcerptCount", 400], ["cmMetaTitle", "cmMetaTitleCount", 60], ["cmMetaDesc", "cmMetaDescCount", 155]].forEach(function (c) {
      var inp = $(c[0]), out = $(c[1]);
      var upd = function () { var n = inp.value.length; out.textContent = n + " / " + c[2]; out.className = n > c[2] ? "over" : ""; };
      inp.addEventListener("input", upd); inp._upd = upd; upd();
    });
    // Le bouton « retour » du téléphone ferme l'éditeur au lieu de quitter l'application
    window.addEventListener("popstate", function () { if ($("cmBlogView").classList.contains("open")) closePost(true); });
  }

  // ------------------------------------------------------------------ AVIS
  async function loadAvis() {
    var list = $("cmAvisList");
    var q = new URLSearchParams({ limit: "50" });
    if (CM.avisFilter !== "all") q.set("statut", CM.avisFilter);
    if (CM.avisSearch) q.set("search", CM.avisSearch);
    try {
      var j = await req("/api/admin/avis?" + q.toString());
      CM.avis = j.data.avis || [];
      if (!CM.avis.length) {
        list.innerHTML = '<div class="empty-state"><span class="empty-state__icon">⭐</span><div class="empty-state__title">' + esc(t("cm_no_reviews")) + "</div></div>";
        return;
      }
      list.innerHTML = CM.avis.map(function (a) {
        return '<div class="recente-item" data-id="' + esc(a.id) + '"><div class="recente-avatar">' + esc((a.displayName || "?").charAt(0).toUpperCase()) + "</div>" +
          '<div class="recente-info"><div class="recente-name">' + esc(a.displayName) + ' · <span class="cm-stars">' + stars(a.rating) + "</span></div>" +
          '<div class="recente-sub">' + esc((a.comment || "").slice(0, 70)) + ((a.comment || "").length > 70 ? "…" : "") + "</div></div>" +
          '<div style="text-align:right;"><span class="cm-pill cm-pill--' + esc(a.status) + '">' + esc(t("cm_status_" + a.status)) + "</span>" +
          '<div style="font-size:10px;color:var(--muted);margin-top:4px;">' + (a.consentGoogle ? "🇬 " : "") + fmtDate(a.createdAt) + "</div></div></div>";
      }).join("");
      Array.prototype.forEach.call(list.querySelectorAll(".recente-item"), function (n) {
        n.addEventListener("click", function () { openReview(n.dataset.id); });
      });
    } catch (e) { list.innerHTML = '<div class="empty-state"><div class="empty-state__title">' + esc(e.message) + "</div></div>"; }
  }

  function openReview(id) {
    var a = CM.avis.filter(function (x) { return x.id === id; })[0]; if (!a) return;
    CM.currentAvisId = id;
    $("cmReviewTitle").textContent = a.displayName;
    var row = function (label, val) { return '<div class="detail-row"><span class="detail-row__label">' + esc(label) + '</span><span class="detail-row__value">' + val + "</span></div>"; };
    $("cmReviewBody").innerHTML =
      '<div class="detail-section"><div class="detail-section__title">' + esc(t("cm_review_title")) + "</div>" +
      row(t("cm_stars"), '<span class="cm-stars">' + stars(a.rating) + "</span> (" + a.rating + "/5)") +
      row("Status", '<span class="cm-pill cm-pill--' + esc(a.status) + '">' + esc(t("cm_status_" + a.status)) + "</span>") +
      row(t("cm_consent_pub"), a.consentPublication ? t("cm_yes") : t("cm_no")) +
      row(t("cm_consent_google"), a.consentGoogle ? esc(t("cm_google_yes")) : esc(t("cm_no"))) +
      row(t("cm_comment"), "") +
      '<p style="white-space:pre-line;font-size:14px;line-height:1.5;margin-top:4px;">' + esc(a.comment) + "</p></div>" +
      '<div class="detail-section"><div class="detail-section__title">' + esc(t("cm_client_internal")) + "</div>" +
      row(t("cm_reference"), esc(a.referenceNumber)) + row("Name", esc(a.clientNomComplet)) + row("E-Mail", esc(a.clientEmail)) + row("Kredit", esc(a.kreditart || "—")) + "</div>" +
      '<div class="detail-section"><div class="detail-section__title">' + esc(t("cm_moderation")) + "</div>" +
      '<div class="cm-note">ℹ️ ' + esc(t("cm_mod_info")) + "</div>" +
      '<label class="form-label">' + esc(t("cm_reason")) + "</label>" +
      '<select class="form-input" id="cmReason"><option value="">' + esc(t("cm_reason_pick")) + "</option>" +
      REASONS.map(function (r) { return '<option value="' + r + '"' + (a.moderationReason === r ? " selected" : "") + ">" + esc(t("cm_r_" + r)) + "</option>"; }).join("") + "</select>" +
      '<textarea id="cmNote" class="reply-textarea" rows="2" style="margin-top:8px;" placeholder="' + esc(t("cm_note_ph")) + '">' + esc(a.moderationNote || "") + "</textarea>" +
      '<div class="cm-actions">' +
      '<button class="btn-save" data-s="approved" style="margin:0;">' + esc(t("cm_approve")) + "</button>" +
      '<button class="btn-action" data-s="pending">' + esc(t("cm_back_pending")) + "</button>" +
      '<button class="btn-action" data-s="rejected">' + esc(t("cm_reject")) + "</button>" +
      '<button class="btn-action" data-s="hidden">' + esc(t("cm_hide")) + "</button>" +
      '<button class="btn-action cm-danger" id="cmReviewDelete" style="grid-column:1/-1;">' + esc(t("cm_delete")) + "</button></div></div>";
    Array.prototype.forEach.call($("cmReviewBody").querySelectorAll("[data-s]"), function (b) {
      b.addEventListener("click", function () { setReviewStatus(b.dataset.s); });
    });
    $("cmReviewDelete").addEventListener("click", deleteReview);
    $("cmReviewDrawer").classList.add("open"); $("cmReviewOverlay").classList.add("open"); document.body.style.overflow = "hidden";
  }
  function closeReview() {
    $("cmReviewDrawer").classList.remove("open"); $("cmReviewOverlay").classList.remove("open"); document.body.style.overflow = "";
  }
  async function setReviewStatus(statut) {
    var reason = $("cmReason").value;
    if ((statut === "rejected" || statut === "hidden") && !reason) { toast(t("cm_reason_need"), "error"); $("cmReason").focus(); return; }
    try {
      var j = await req("/api/admin/avis/" + CM.currentAvisId + "/statut", "PUT", { statut: statut, reason: reason, moderationNote: $("cmNote").value });
      toast(j.message || t("cm_saved")); closeReview(); loadAvis(); CM.refreshBadge();
    } catch (e) { fail(e); }
  }
  async function deleteReview() {
    if (!window.confirm(t("cm_delete_review_confirm"))) return;
    try { await req("/api/admin/avis/" + CM.currentAvisId, "DELETE"); toast(t("cm_saved")); closeReview(); loadAvis(); CM.refreshBadge(); } catch (e) { fail(e); }
  }

  // ------------------------------------------------------------------ BLOG : liste
  async function loadPosts() {
    var list = $("cmBlogList");
    var q = new URLSearchParams({ limit: "50" });
    if (CM.blogFilter !== "all") q.set("statut", CM.blogFilter);
    if (CM.blogSearch) q.set("search", CM.blogSearch);
    try {
      var j = await req("/api/admin/blog?" + q.toString());
      CM.posts = j.data.articles || [];
      if (!CM.posts.length) {
        list.innerHTML = '<div class="empty-state"><span class="empty-state__icon">✍️</span><div class="empty-state__title">' + esc(t("cm_no_posts")) + "</div></div>";
        return;
      }
      list.innerHTML = CM.posts.map(function (a) {
        var thumb = a.coverUrl ? '<img class="cm-thumb" src="' + esc(a.coverUrl.replace(/w_\d+/, "w_160")) + '" alt="" loading="lazy" />' : '<div class="cm-thumb">✍️</div>';
        return '<div class="recente-item" data-id="' + esc(a.id) + '">' + thumb +
          '<div class="recente-info"><div class="recente-name">' + esc(a.title) + "</div>" +
          '<div class="recente-sub">' + (a.category ? esc(a.category) + " · " : "") + a.views + " " + esc(t("cm_views")) + "</div></div>" +
          '<div style="text-align:right;"><span class="cm-pill cm-pill--' + esc(a.status) + '">' + esc(t("cm_status_" + a.status)) + "</span>" +
          '<div style="font-size:10px;color:var(--muted);margin-top:4px;">' + fmtDate(a.status === "published" ? a.publishedAt : a.updatedAt) + "</div></div></div>";
      }).join("");
      Array.prototype.forEach.call(list.querySelectorAll(".recente-item"), function (n) {
        n.addEventListener("click", function () { openPost(n.dataset.id); });
      });
    } catch (e) { list.innerHTML = '<div class="empty-state"><div class="empty-state__title">' + esc(e.message) + "</div></div>"; }
  }

  // ------------------------------------------------------------------ BLOG : éditeur
  function setCover(url) {
    CM.coverUrl = url || "";
    var img = $("cmCoverImg");
    if (CM.coverUrl) { img.src = CM.coverUrl.replace(/w_\d+/, "w_320"); img.style.display = ""; } else { img.removeAttribute("src"); img.style.display = "none"; }
    $("cmCoverRemove").style.display = CM.coverUrl ? "" : "none";
    $("cmCoverBtn").textContent = t("cm_f_cover_pick");
  }
  function fillPost(a) {
    CM.current = a || null;
    $("cmTitle").value = a ? a.title : "";
    $("cmCategory").value = a ? a.category : "";
    $("cmAuthor").value = a ? a.authorName : ((App.user && App.user.name) || "");
    $("cmExcerpt").value = a ? a.excerpt : "";
    $("cmMetaTitle").value = a ? a.metaTitle : "";
    $("cmMetaDesc").value = a ? a.metaDescription : "";
    $("cmSlug").value = a ? a.slug : "";
    $("cmCoverAlt").value = a ? a.coverAlt : "";
    CM.slugTouched = !!a;
    setCover(a ? a.coverUrl : "");
    CM.editor.setHtml(a ? a.content : "");
    ["cmExcerpt", "cmMetaTitle", "cmMetaDesc"].forEach(function (id) { $(id)._upd(); });
    var pub = !!(a && a.status === "published");
    $("cmBlogPublish").style.display = pub ? "none" : "";
    $("cmBlogUnpublish").style.display = pub ? "" : "none";
    $("cmBlogDelete").style.display = a ? "" : "none";
    var pill = $("cmBlogStatusPill");
    pill.className = "cm-pill cm-pill--" + (pub ? "published" : "draft");
    pill.textContent = t(pub ? "cm_status_published" : "cm_status_draft");
    $("cmBlogViewTitle").textContent = a ? t("cm_edit_post_title") : t("cm_new_post_title");
  }
  async function openPost(id) {
    if (!CM.editor) {
      CM.editor = BlitzBlogEditor.create({
        mount: $("cmEditorMount"), uploadImage: uploadImage,
        notify: function (m, ty) { toast(m, ty === "error" ? "error" : "success"); }
      });
    }
    try {
      var a = null;
      if (id) { a = (await req("/api/admin/blog/" + id)).data.article; }
      else { try { var s = (await req("/api/admin/blog/stats")).data; var dl = $("cmCatList"); dl.innerHTML = (s.categories || []).map(function (c) { return '<option value="' + esc(c) + '">'; }).join(""); } catch (e) { /* facultatif */ } }
      fillPost(a);
      $("cmBlogView").classList.add("open");
      $("cmBlogBody").scrollTop = 0;
      history.pushState({ cmEditor: true }, "");
    } catch (e) { fail(e); }
  }
  function closePost(fromPop) {
    if (CM.editor && CM.editor.isDirty() && !window.confirm(t("cm_unsaved"))) {
      if (fromPop === true) history.pushState({ cmEditor: true }, "");
      return;
    }
    $("cmBlogView").classList.remove("open");
    $("cmPreview").classList.remove("open");
    if (fromPop !== true && history.state && history.state.cmEditor) history.back();
    loadPosts(); CM.refreshBadge();
  }
  function postPayload() {
    return {
      title: $("cmTitle").value.trim(), slug: $("cmSlug").value.trim() || slugify($("cmTitle").value), category: $("cmCategory").value.trim(),
      authorName: $("cmAuthor").value.trim(), excerpt: $("cmExcerpt").value.trim(), coverUrl: CM.coverUrl, coverAlt: $("cmCoverAlt").value.trim(),
      metaTitle: $("cmMetaTitle").value.trim(), metaDescription: $("cmMetaDesc").value.trim(), content: CM.editor.getHtml()
    };
  }
  async function savePost(silent) {
    var p = postPayload();
    if (p.title.length < 3) { toast(t("cm_title_needed"), "error"); $("cmTitle").focus(); throw new Error("Titel"); }
    try {
      var j = CM.current ? await req("/api/admin/blog/" + CM.current.id, "PUT", p) : await req("/api/admin/blog", "POST", p);
      CM.current = j.data.article; CM.editor.markClean(); $("cmSlug").value = CM.current.slug;
      $("cmBlogDelete").style.display = "";
      if (!silent) toast(t("cm_saved"));
      return CM.current;
    } catch (e) { if (e.message !== "Titel") fail(e); throw e; }
  }
  async function setPostStatus(statut) {
    try {
      var a = await savePost(true);
      var j = await req("/api/admin/blog/" + a.id + "/statut", "PUT", { statut: statut });
      fillPost(j.data.article); toast(j.message || t("cm_saved"));
    } catch (e) { /* déjà notifié */ }
  }
  function previewPost() {
    var p = postPayload();
    var body = $("cmPreviewBody");
    body.innerHTML = "";
    var h1 = document.createElement("h1"); h1.textContent = p.title || "—"; body.appendChild(h1);
    if (p.coverUrl) { var im = document.createElement("img"); im.className = "cover"; im.src = p.coverUrl; im.alt = p.coverAlt || ""; body.appendChild(im); }
    var shell = document.createElement("div"); shell.className = "bbe";
    var area = document.createElement("div"); area.className = "bbe-area"; area.style.minHeight = "0"; area.innerHTML = p.content;
    shell.appendChild(area); body.appendChild(shell);
    $("cmPreview").classList.add("open");
  }
  async function deletePost() {
    if (!CM.current || !window.confirm(t("cm_delete_post_confirm"))) return;
    try {
      await req("/api/admin/blog/" + CM.current.id, "DELETE");
      CM.editor.markClean(); toast(t("cm_saved")); closePost();
    } catch (e) { fail(e); }
  }

  // ------------------------------------------------------------------ API publique du module
  CM.onShow = function () {
    build();
    CM.mode === "avis" ? loadAvis() : loadPosts();
    CM.refreshBadge();
  };
  CM.refreshBadge = async function () {
    if (!App.token) return;
    try {
      var j = await req("/api/admin/avis/stats");
      var n = (j.data.parStatut && j.data.parStatut.pending) || 0;
      var tabBadge = $("inhalteBadge");
      if (tabBadge) { tabBadge.textContent = n; tabBadge.classList.toggle("show", n > 0); }
      var segBadge = $("cmPendingBadge");
      if (segBadge) { segBadge.textContent = n; segBadge.classList.toggle("show", n > 0); }
    } catch (e) { /* le badge est facultatif */ }
  };
  setInterval(function () { if (App.token && !document.hidden) CM.refreshBadge(); }, 60000);
  if (App.token) CM.refreshBadge();
})();
