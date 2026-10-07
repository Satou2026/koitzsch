const CACHE_NAME = "blitz-chat-app-v2";
const STATIC_CACHE = "blitz-chat-app-static-v2";
const PRECACHE_URLS = [
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Les échanges de chat (API) doivent toujours passer par le réseau —
  // jamais de version en cache pour des messages.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }
  // Réseau en priorité : on va toujours chercher la dernière version en
  // ligne d'abord, et on ne se rabat sur le cache que si le réseau est
  // indisponible (mode hors-ligne). Ça évite qu'une app installée reste
  // bloquée sur une ancienne version après une mise à jour.
  event.respondWith(
    fetch(event.request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match(event.request))
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "Finanzberatung Koitzsch u. Schuchardt", body: "Neue Nachricht von Ihrem Berater" };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Finanzberatung Koitzsch u. Schuchardt", {
      body: data.body || "",
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      tag: data.tag || "blitz-chat",
      data,
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = "./index.html";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes("chat-app"));
      if (existing) {
        existing.focus();
      } else {
        self.clients.openWindow(targetUrl);
      }
    })
  );
});
