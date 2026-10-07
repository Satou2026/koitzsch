(function () {
  "use strict";

  function getApiBase() {
    return window.BlitzNotify && window.BlitzNotify.getApiBase ? window.BlitzNotify.getApiBase() : "https://api.blitzleihen.com";
  }

  function getToken() {
    var params = new URLSearchParams(window.location.search);
    return (params.get("token") || "").trim();
  }

  function showOnly(id) {
    ["avisLoading", "avisInvalid", "avisForm", "avisSuccess"].forEach(function (elId) {
      var el = document.getElementById(elId);
      if (!el) return;
      el.style.display = elId === id ? (elId === "avisForm" ? "block" : "block") : "none";
    });
  }

  var INVALID_MESSAGES = {
    not_found: "Dieser Bewertungslink ist ungültig. Bitte prüfen Sie, ob Sie den vollständigen Link aus der E-Mail verwendet haben.",
    already_submitted: "Für Ihren Antrag wurde bereits eine Bewertung abgegeben. Vielen Dank dafür!",
    expired: "Dieser Bewertungslink ist leider abgelaufen. Bitte kontaktieren Sie uns, falls Sie dennoch eine Bewertung abgeben möchten.",
    missing: "Es wurde kein Bewertungslink angegeben. Bitte verwenden Sie den Link aus Ihrer Einladungs-E-Mail."
  };

  function showInvalid(reason) {
    var textEl = document.getElementById("avisInvalidText");
    if (textEl) textEl.textContent = INVALID_MESSAGES[reason] || INVALID_MESSAGES.not_found;
    showOnly("avisInvalid");
  }

  function init() {
    var token = getToken();
    if (!token) {
      showInvalid("missing");
      return;
    }

    var apiBase = getApiBase();

    fetch(apiBase + "/api/avis/token?token=" + encodeURIComponent(token))
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.data || result.data.data === undefined) {
          showInvalid("not_found");
          return;
        }
        var info = result.data.data;
        if (!info.valid) {
          showInvalid(info.reason || "not_found");
          return;
        }
        var titleEl = document.getElementById("avisFormTitle");
        if (titleEl && info.vorname) {
          titleEl.textContent = "Hallo " + info.vorname + ", Ihre Bewertung";
        }
        showOnly("avisForm");
        initGoogleOption();
        initForm(token);
      })
      .catch(function (err) {
        console.error("[Finanzberatung Koitzsch u. Schuchardt] Netzwerkfehler bei der Prüfung des Bewertungslinks:", err);
        showInvalid("not_found");
      });
  }

  // La case « Auch auf Google teilen » n'apparaît que si le lien de la fiche Google est configuré côté serveur :
  // on ne promet jamais une redirection qui ne pourrait pas avoir lieu.
  function initGoogleOption() {
    fetch(getApiBase() + "/api/settings/public")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var url = j && j.data && j.data.googleReviewUrl;
        var group = document.getElementById("avisGoogleGroup");
        if (url && group) group.style.display = "flex";
      })
      .catch(function () { /* silencieux : sans réponse, la case reste masquée */ });
  }

  function initForm(token) {
    var form = document.getElementById("avisForm");
    if (!form) return;
    var submitBtn = document.getElementById("avisSubmitBtn");
    var errorBox = document.getElementById("avisError");
    var errorText = document.getElementById("avisErrorText");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      submit();
    });

    function submit() {
      var ratingInput = form.querySelector('input[name="rating"]:checked');
      if (!ratingInput) {
        showError("Bitte wählen Sie eine Bewertung von 1 bis 5 Sternen aus.");
        return;
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Wird gesendet…";
      }
      hideError();

      var payload = {
        token: token,
        rating: parseInt(ratingInput.value, 10),
        comment: form.querySelector('[name="comment"]').value.trim(),
        displayName: form.querySelector('[name="displayName"]').value.trim(),
        consentPublication: form.querySelector('[name="consentPublication"]').checked,
        consentGoogle: !!(form.querySelector('[name="consentGoogle"]') || {}).checked
      };
      lastComment = payload.comment;

      var apiBase = getApiBase();
      fetch(apiBase + "/api/avis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data.success) {
            onSuccess(result.data.data || {});
          } else {
            console.error("[Finanzberatung Koitzsch u. Schuchardt] Fehler beim Senden der Bewertung:", result.data);
            showError((result.data && result.data.message) || "Ihre Bewertung konnte nicht gesendet werden. Bitte versuchen Sie es erneut.");
            resetButton();
          }
        })
        .catch(function (err) {
          console.error("[Finanzberatung Koitzsch u. Schuchardt] Netzwerkfehler beim Senden der Bewertung:", err);
          showError("Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.");
          resetButton();
        });
    }

    function showError(msg) {
      if (errorText) errorText.innerHTML = "<strong>Fehler beim Senden.</strong> " + msg;
      if (errorBox) errorBox.style.display = "flex";
    }
    function hideError() {
      if (errorBox) errorBox.style.display = "none";
    }
    function resetButton() {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "⭐ Bewertung absenden";
      }
    }
  }

  var lastComment = "";

  // Copie « au mieux » en trois étapes : API Clipboard, puis execCommand, puis champ de texte à copier à la main.
  function copyToClipboard(text) {
    function legacy() {
      return new Promise(function (resolve, reject) {
        var ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.focus(); ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error("copy failed"));
      });
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(legacy);
    }
    return legacy();
  }

  function onSuccess(data) {
    showOnly("avisSuccess");
    // Le lien Google n'est renvoyé par le serveur que si le client a coché la case ET que le lien est configuré.
    if (data.googleReviewUrl) {
      var ctaBox = document.getElementById("avisGoogleCta");
      var ctaLink = document.getElementById("avisGoogleLink");
      if (ctaBox && ctaLink) {
        ctaLink.href = data.googleReviewUrl;
        ctaBox.style.display = "block";
        ctaLink.addEventListener("click", function () {
          // On ne bloque pas le lien : la copie est « au mieux » ; Google s'ouvre dans tous les cas.
          copyToClipboard(lastComment).then(function () {
            var ok = document.getElementById("avisGoogleCopied");
            if (ok) ok.style.display = "block";
          }).catch(function () {
            var box = document.getElementById("avisGoogleManual");
            var ta = document.getElementById("avisGoogleManualText");
            if (box && ta) { ta.value = lastComment; box.style.display = "block"; ta.focus(); ta.select(); }
          });
        });
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
