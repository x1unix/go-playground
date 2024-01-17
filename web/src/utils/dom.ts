export const isTouchDevice = () => (
  'ontouchstart' in window ||
  navigator.maxTouchPoints > 0 ||
  navigator['msMaxTouchPoints'] > 0
);
