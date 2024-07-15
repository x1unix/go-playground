/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

// eslint-disable-next-line import/no-anonymous-default-export
export default null

declare const self: ServiceWorkerGlobalScope;

// Stub to get self-destruct SW building.
const noop = (_v: any) => {}

//@ts-expect-error -- value provided externally
noop(self.__WB_MANIFEST)

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
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
});
