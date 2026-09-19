import { THEME_DARK, THEME_LIGHT, THEME_STORAGE_KEY } from '@/constants/theme';
import { persistTheme } from '@/utils/theme';

describe('persistTheme', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stores the dark theme under the theme storage key', () => {
    persistTheme(THEME_DARK);

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(THEME_DARK);
  });

  it('stores the light theme under the theme storage key', () => {
    persistTheme(THEME_LIGHT);

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(THEME_LIGHT);
  });

  it('overwrites a previously stored theme', () => {
    persistTheme(THEME_DARK);
    persistTheme(THEME_LIGHT);

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(THEME_LIGHT);
  });

  it('does not throw when writing to storage fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    expect(() => {
      persistTheme(THEME_DARK);
    }).not.toThrow();
  });

  it('does not throw when storage is inaccessible', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    expect(() => {
      persistTheme(THEME_DARK);
    }).not.toThrow();
  });
});
