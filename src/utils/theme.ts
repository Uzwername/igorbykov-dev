import { THEME_STORAGE_KEY } from '@/constants/theme';
import { localStorage } from '@/utils/localStorage';
import type { Theme } from '@/types/theme';

export const persistTheme = (theme: Theme): void => {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
};
