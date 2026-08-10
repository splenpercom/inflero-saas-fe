/** Read a storage value. */
export function getStorageItem(storage: Storage, key: string): string | null {
  return storage.getItem(key);
}

export function getStorageJson<T>(storage: Storage, key: string): T | null {
  const raw = getStorageItem(storage, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
