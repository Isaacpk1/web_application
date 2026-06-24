export function pickDefined<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
  return keys.reduce<Partial<Pick<T, K>>>((picked, key) => {
    if (source[key] !== undefined) {
      picked[key] = source[key];
    }

    return picked;
  }, {}) as Pick<T, K>;
}

export function withDefaults<T extends object>(source: T, defaults: Partial<T>): T {
  return { ...defaults, ...pickDefined(source, Object.keys(source) as Array<keyof T>) } as T;
}
