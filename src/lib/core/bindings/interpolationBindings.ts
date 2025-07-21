type Store<T> = {
  state: T;
  subscribe<K extends keyof T>(key: K, fn: (val: T[K]) => void): void;
  setState<K extends keyof T>(key: K, val: T[K]): void;
};

export function applyBindings<T extends Record<string, any>>(root: HTMLElement, store: Store<T>) {
  const interpolate = (str: string) => {
    return str.replace(/\{\{(.+?)\}\}/g, (_, key) => {
      const val = store.state[key.trim()];
      return val !== undefined ? String(val) : '';
    });
  };

  const bindText = (el: HTMLElement, key: keyof T) => {
    store.subscribe(key, (val) => {
      el.textContent = val;
    });
  };

  const bindModel = (el: HTMLInputElement, key: keyof T) => {
    el.value = store.state[key];
    el.addEventListener('input', (e) => {
      store.setState(key, (e.target as any).value);
    });
    store.subscribe(key, (val) => {
      if (el.value !== val) el.value = val;
    });
  };

  const traverse = (el: HTMLElement) => {
    if (el.hasAttribute('data-bind-text')) {
      const key = el.getAttribute('data-bind-text') as keyof T;
      bindText(el, key);
    }

    if (el.hasAttribute('data-model')) {
      const key = el.getAttribute('data-model') as keyof T;
      if (el instanceof HTMLInputElement) {
        bindModel(el, key);
      }
    }

    // Interpolation in plain text nodes
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
      const originalText = el.textContent || '';
      if (originalText.includes('{{')) {
        const keyMatches = [...originalText.matchAll(/\{\{(.+?)\}\}/g)];
        keyMatches.forEach(([, rawKey]) => {
          const key = rawKey.trim() as keyof T;
          store.subscribe(key, () => {
            el.textContent = interpolate(originalText);
          });
        });
        el.textContent = interpolate(originalText);
      }
    }

    for (const child of el.children) {
      traverse(child as HTMLElement);
    }
  };

  traverse(root);
}
