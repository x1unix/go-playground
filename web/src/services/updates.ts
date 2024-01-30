import client from '~/services/api'
import environment from '~/environment'

export interface UpdateInfo {
  newVersion: string
}

/**
 * Checks for application updates and returns new available version.
 *
 * Returns null if no updates available.
 */
export const checkUpdates = async (): Promise<UpdateInfo | null> => {
  if (!window.navigator.onLine) {
    console.log('updater: application is offline, skip.')
    return null
  }

  const { version: newVersion } = await client.getVersion()
  const { appVersion } = environment
  if (newVersion === appVersion) {
    console.log('updater: app is up to date:', newVersion)
    return null
  }

  console.log(`updater: new update is available - ${newVersion}`)
  return {
    newVersion,
  }

  // if (!('serviceWorker' in navigator)) {
  //   console.warn('updater: no SW registrations found, skip');
  //   return;
  // }
  //
  // const registrations = await navigator.serviceWorker.getRegistrations();
  // if (!registrations?.length) {
  //   console.warn('updater: no SW registrations found, skip');
  //   return;
  // }

  // await truncateCachesAndRegister(registrations);
}

// const truncateCachesAndRegister = async (registrations: readonly ServiceWorkerRegistration[]) => {
//   console.log(`updater: unregistering ${registrations.length} service workers...`);
//   await Promise.all(registrations.map(r => r.unregister()));
//
//   console.log('updater: truncating caches', caches.keys());
//
//   for (const sw of registrations) {
//     const ok = await sw.unregister();
//     if (!ok) {
//       console.
//     }
//   }
//   console.log('updater: truncating all caches');
// }
