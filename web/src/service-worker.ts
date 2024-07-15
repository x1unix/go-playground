/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

// eslint-disable-next-line import/no-anonymous-default-export
export default null

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  self.registration.unregister()
    .then(function() {
      return self.clients.matchAll();
    })
    .then(function(clients) {
      clients.forEach(client => {
        if ('navigate' in client && typeof client.navigate === 'function') {
          client.navigate(client.url)
        }
    })
    });
});
