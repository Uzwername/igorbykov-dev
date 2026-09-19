const getItem = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setItem = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Roll with it
  }
};

const removeItem = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Roll with it
  }
};

const clear = (): void => {
  try {
    window.localStorage.clear();
  } catch {
    // Roll with it
  }
};

export const localStorage = {
  getItem,
  setItem,
  removeItem,
  clear,
};
