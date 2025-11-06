type Events = {
  "create-task": { title: string };
  "toast": { message: string; type?: 'info' | 'success' | 'error' };
  "fab": { hidden: boolean };
};

// Internals: store as any to avoid indexed access type narrowing issues in strict mode
const listeners: Record<string, Array<(payload: any) => void>> = {};

export const bus = {
  on<K extends keyof Events>(type: K, cb: (payload: Events[K]) => void) {
    (listeners[type as string] ||= []).push(cb as any);
    return () => bus.off(type, cb as any);
  },
  off<K extends keyof Events>(type: K, cb: (payload: Events[K]) => void) {
    const arr = listeners[type as string];
    if (!arr) return;
    const i = arr.indexOf(cb as any);
    if (i >= 0) arr.splice(i, 1);
  },
  emit<K extends keyof Events>(type: K, payload: Events[K]) {
    const arr = listeners[type as string];
    if (!arr) return;
    for (const cb of [...arr]) cb(payload as any);
  }
};
