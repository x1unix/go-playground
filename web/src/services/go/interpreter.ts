export async function foo() {
  const w = new Worker(new URL('../../workers/go.worker.ts', import.meta.url));
}
