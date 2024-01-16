export const createDebounceResizeObserver = (callback: () => void, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return new ResizeObserver(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(callback, delay);
  });
};

export const isTouchDevice = () => (
  'ontouchstart' in window ||
  navigator.maxTouchPoints > 0 ||
  navigator['msMaxTouchPoints'] > 0
);
