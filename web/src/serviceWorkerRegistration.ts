/// <reference types="node" />

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        void registration.unregister()
      })
      .catch((error) => {
        console.error('failed to unregister service worker:', error.message)
      })
  }
}
