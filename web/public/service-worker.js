// Self-destructible service worker stub to self-destruct old broken v1 SW

self.addEventListener('install', function(e) {
  self.skipWaiting();
})

self.addEventListener('activate', function(e) {
  self.registration.unregister()
    .then(function () {
      return self.clients.matchAll();
    })
    .then(function (clients) {
      clients.forEach(client => {
        if (client instanceof WindowClient) {
          client.navigate(client.url)
        }
      })
    });
})
