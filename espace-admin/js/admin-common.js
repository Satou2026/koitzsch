window.BlitzAdmin = (function() {
  "use strict";
  var API_BASE = (document.querySelector('meta[name="api-base"]')?.getAttribute("content") || window.BLITZ_API_BASE || "https://api.blitzleihen.com").replace(/\/$/, "") + "/api";
  function checkAuth() {
    var token = sessionStorage.getItem("blitz_admin_token");
    if (!token) {
      window.location.href = "login.html";
      return false;
    }
    return token;
  }
  function authHeaders() {
    var token = sessionStorage.getItem("blitz_admin_token");
    return {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    };
  }
  function logout() {
    sessionStorage.removeItem("blitz_admin_token");
    sessionStorage.removeItem("blitz_admin_user");
    window.location.href = "login.html";
  }
  function loadUserInfo() {
    var userStr = sessionStorage.getItem("blitz_admin_user");
    if (!userStr) return null;
    try {
      var user = JSON.parse(userStr);
      var initial = user.name ? user.name[0].toUpperCase() : "A";
      ["userAvatar", "topbarAvatar"].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = initial;
      });
      var nameEl = document.getElementById("userName");
      if (nameEl) nameEl.textContent = user.name || "Administrator";
      return user;
    } catch (e) {
      return null;
    }
  }
  function initSidebar() {
    var toggleBtn = document.getElementById("sidebarToggle");
    var sidebar = document.getElementById("adminSidebar");
    var backdrop = document.getElementById("sidebarBackdrop");
    function close() {
      if (sidebar) sidebar.classList.remove("open");
      if (backdrop) backdrop.classList.remove("open");
    }
    function toggle() {
      if (sidebar) sidebar.classList.toggle("open");
      if (backdrop) backdrop.classList.toggle("open");
    }
    if (toggleBtn) toggleBtn.addEventListener("click", toggle);
    if (backdrop) backdrop.addEventListener("click", close);
    if (sidebar) {
      sidebar.querySelectorAll(".admin-nav__link").forEach(function(link) {
        link.addEventListener("click", close);
      });
    }
    if (toggleBtn && window.innerWidth <= 1024) {
      toggleBtn.style.display = "flex";
    }
    var navEmailsSoon = document.getElementById("navEmailsSoon");
    if (navEmailsSoon) {
      navEmailsSoon.addEventListener("click", function(e) {
        e.preventDefault();
        showToast("E-Mail-Verlauf: bald verf\xFCgbar");
      });
    }
    updateKontaktBadge();
    updateAvisBadge();
  }
  function updateKontaktBadge() {
    var badge = document.getElementById("kontaktCount");
    if (!badge) return;
    var token = sessionStorage.getItem("blitz_admin_token");
    if (!token) return;
    // L'onglet Kontakt n'affiche plus que les décisions du client sur le
    // taux proposé (accepté / refusé / réflexion) — le badge doit compter
    // les mêmes éléments (voir aussi kontakt.html et admin-mobile).
    fetch(API_BASE + "/contact?statut=neu&decision_taux=1&limit=1", {
      headers: { "Authorization": "Bearer " + token }
    }).then(function(r) {
      return r.ok ? r.json() : null;
    }).then(function(json) {
      if (!json || !json.success) return;
      var total = json.data && json.data.pagination && json.data.pagination.total || 0;
      badge.textContent = total;
      badge.style.display = total > 0 ? "" : "none";
    }).catch(function() {
    });
  }
  function updateAvisBadge() {
    var badge = document.getElementById("avisPendingCount");
    if (!badge) return;
    var token = sessionStorage.getItem("blitz_admin_token");
    if (!token) return;
    fetch(API_BASE + "/admin/avis/stats", {
      headers: { "Authorization": "Bearer " + token }
    }).then(function(r) {
      return r.ok ? r.json() : null;
    }).then(function(json) {
      if (!json || !json.success) return;
      var pending = json.data && json.data.parStatut && json.data.parStatut.pending || 0;
      badge.textContent = pending;
      badge.style.display = pending > 0 ? "" : "none";
    }).catch(function() {
    });
  }
  function showToast(message) {
    var wrap = document.getElementById("adminToastWrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "admin-toast-wrap";
      wrap.id = "adminToastWrap";
      document.body.appendChild(wrap);
    }
    var toast = document.createElement("div");
    toast.className = "admin-toast";
    toast.textContent = message;
    wrap.appendChild(toast);
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2800);
  }

  // Sélecteur de pièces jointes réutilisable pour tous les champs "répondre
  // au client" (offre/RIB/quittance, réponse générale à une demande, Kontakt).
  // Chaque appel crée une instance indépendante (fermeture sur son propre
  // tableau `items`), identifiée par une clé utilisée pour les IDs DOM —
  // à appeler une fois par champ, sur chaque page qui en a besoin.
  function createAttachmentPicker(key) {
    var items = [];
    function iconFor(mime) {
      mime = mime || "";
      if (mime.indexOf("image/") === 0) return "\u{1F5BC}\uFE0F";
      if (mime.indexOf("video/") === 0) return "\u{1F3AC}";
      if (mime.indexOf("audio/") === 0) return "\u{1F3B5}";
      if (mime === "application/pdf") return "\u{1F4C4}";
      return "\u{1F4CE}";
    }
    function escapeHtml(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function(c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function html() {
      return '<div class="attach-zone" id="attachZone_' + key + '">' +
        '<input type="file" id="attachInput_' + key + '" multiple style="display:none;" accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv">' +
        '<button type="button" class="btn-attach" id="attachBtn_' + key + '">\u{1F4CE} Anhang hinzuf\u00FCgen</button>' +
        '<div class="attach-list" id="attachList_' + key + '"></div>' +
        '</div>';
    }
    function render() {
      var el = document.getElementById("attachList_" + key);
      if (!el) return;
      el.innerHTML = items.map(function(a) {
        return '<span class="attach-chip' + (a.uploading ? " is-uploading" : "") + '">' +
          (a.uploading ? "\u23F3" : iconFor(a.type)) +
          '<span class="attach-chip__name">' + escapeHtml(a.nom) + '</span>' +
          (a.uploading ? "" : '<button type="button" class="attach-chip__remove" data-tempid="' + a._tempId + '">\u00D7</button>') +
          '</span>';
      }).join("");
      Array.prototype.forEach.call(el.querySelectorAll(".attach-chip__remove"), function(b) {
        b.addEventListener("click", function(e) {
          remove(e.currentTarget.getAttribute("data-tempid"));
        });
      });
    }
    function remove(tempId) {
      items = items.filter(function(a) { return a._tempId !== tempId; });
      render();
    }
    function upload(file) {
      if (items.length >= 8) {
        showToast("Maximal 8 Anh\u00E4nge pro Nachricht");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        showToast("Datei zu gro\u00DF (max. 15 MB): " + file.name);
        return;
      }
      var item = {
        _tempId: Math.random().toString(36).slice(2),
        nom: file.name, type: file.type, taille: file.size,
        url: "", uploading: true,
      };
      items.push(item);
      render();
      var fd = new FormData();
      fd.append("file", file);
      var token = sessionStorage.getItem("blitz_admin_token");
      fetch(API_BASE + "/uploads/piece-jointe", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token },
        body: fd,
      }).then(function(res) {
        if (res.status === 401) {
          logout();
          throw new Error("Sitzung abgelaufen");
        }
        return res.json().then(function(json) {
          if (!res.ok || !json.success) {
            throw new Error((json && json.message) || "Upload fehlgeschlagen");
          }
          item.url = json.data.url;
          item.nom = json.data.nom || item.nom;
          item.type = json.data.type || item.type;
          item.taille = json.data.taille || item.taille;
          item.uploading = false;
          render();
        });
      }).catch(function(e) {
        items = items.filter(function(a) { return a._tempId !== item._tempId; });
        render();
        showToast("Upload fehlgeschlagen: " + e.message);
      });
    }
    function bind() {
      var input = document.getElementById("attachInput_" + key);
      var btn = document.getElementById("attachBtn_" + key);
      if (!input || !btn) return;
      btn.onclick = function() { input.click(); };
      input.onchange = function() {
        var files = Array.prototype.slice.call(input.files || []);
        input.value = "";
        files.forEach(upload);
      };
      render();
    }
    function isUploading() {
      return items.some(function(a) { return a.uploading; });
    }
    function getPayload() {
      return items.filter(function(a) { return !a.uploading && a.url; }).map(function(a) {
        return { url: a.url, nom: a.nom, type: a.type, taille: a.taille };
      });
    }
    function clear() {
      items = [];
      render();
    }
    return { html: html, bind: bind, isUploading: isUploading, getPayload: getPayload, clear: clear };
  }

  return {
    API_BASE,
    checkAuth,
    authHeaders,
    logout,
    loadUserInfo,
    initSidebar,
    showToast,
    updateKontaktBadge,
    updateAvisBadge,
    createAttachmentPicker
  };
})();
