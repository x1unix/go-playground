export async function foo() {
  const w = new Worker(new URL('../../workers/go.worker.ts', import.meta.url));
  w.onerror = (err) => console.log('WORKER ERROR', err);
  w.addEventListener('error', (err) => console.log('WORKER ERROR', err));
}
