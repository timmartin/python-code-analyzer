export function assertNever(x: never): never {
  throw new Error(`Unexpected object ${x}`);
}

export function joinArrays<T>(arrays: T[][]): T[] {
  if (arrays.length === 0) {
    return [];
  }

  if (arrays.length === 1) {
    return arrays[0];
  }

  return arrays[0].concat(...arrays);
}
