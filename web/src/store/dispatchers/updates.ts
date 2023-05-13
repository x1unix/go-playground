import {manualRegister} from '~/serviceWorkerRegistration';
import {newAddNotificationAction, NotificationType} from "~/store/notifications";
import {checkUpdates} from "~/services/updates";

import {Dispatcher} from "./utils";
import {DispatchFn} from "../helpers";

const truncateCachesAndRegister = async (registration: ServiceWorkerRegistration) => {
  console.log(`updater: unregistering service worker...`);
  await registration.unregister();

  console.log('updater: truncating all caches');
  const keys = await caches.keys();
  await Promise.all(keys.map(key => caches.delete(key)));

  console.log('updater: re-registering service worker...');
  manualRegister();
}

const performSelfUpdate = async (dispatch: DispatchFn, newVersion: string)=> {
  if (!('serviceWorker' in navigator)) {
    console.warn('updater: no SW registrations found, skip');
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    console.warn('updater: no SW registrations found, skip');
    return;
  }

  await truncateCachesAndRegister(registration);
  dispatch(newAddNotificationAction({
    id: 'UPDATE',
    type: NotificationType.Warning,
    title: `Update available - ${newVersion}`,
    description: 'Playground was updated. Please refresh page to apply changes.',
    canDismiss: false,
    actions: [
      {
        key: 'refresh',
        label: 'Refresh',
        primary: true,
        onClick: () => {
          window.location.replace("");
        }
      }
    ]
  }));
}

export const dispatchUpdateCheck: Dispatcher = async (dispatch: DispatchFn) => {
  try {
    const rsp = await checkUpdates();
    if (!rsp) {
      return;
    }

    try {
      await performSelfUpdate(dispatch, rsp.newVersion);
    } catch (err) {
      console.error('updater: error during update:', err);
    }
  } catch (err) {
    console.error('updater: failed to check for updates', err);
  }
}
