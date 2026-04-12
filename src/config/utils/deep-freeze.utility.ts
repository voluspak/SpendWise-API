export const deepFreeze = <T = unknown>(object: T): T => {
  Object.freeze(object);
  if (object === undefined) {
    return object;
  }

  Object.getOwnPropertyNames(object).forEach((prop) => {
    if (
      (object as Record<string, unknown>)[prop] !== null &&
      (typeof (object as Record<string, unknown>)[prop] === 'object' ||
        typeof (object as Record<string, unknown>)[prop] === 'function') &&
      !Object.isFrozen((object as Record<string, unknown>)[prop])
    ) {
      deepFreeze((object as Record<string, unknown>)[prop]);
    }
  });

  return object;
};
