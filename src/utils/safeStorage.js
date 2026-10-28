const getLocalStorage = () => {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const readLocalStorage = (key, fallback = null) => {
  try {
    return getLocalStorage()?.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

export const writeLocalStorage = (key, value) => {
  try {
    const storage = getLocalStorage();
    if (!storage) return false;

    storage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
};
