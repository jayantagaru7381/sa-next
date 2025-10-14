import type { Theme, Direction, CommonColors, ThemeProviderProps } from '@mui/material/styles';
import type { ThemeCssVariables } from './types';
import type { PaletteColorKey, PaletteColorNoChannels } from './core/palette';

// ----------------------------------------------------------------------

export type ThemeConfig = {
  direction: Direction;
  classesPrefix: string;
  cssVariables: ThemeCssVariables;
  defaultMode: ThemeProviderProps<Theme>['defaultMode'];
  modeStorageKey: ThemeProviderProps<Theme>['modeStorageKey'];
  fontFamily: Record<'primary' | 'secondary', string>;
  palette: Record<PaletteColorKey, PaletteColorNoChannels> & {
    common: Pick<CommonColors, 'black' | 'white'>;
    grey: {
      [K in 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 as `${K}`]: string;
    };
  };
};

export const themeConfig: ThemeConfig = {
  /** **************************************
   * Base
   *************************************** */
  defaultMode: 'light',
  modeStorageKey: 'theme-mode',
  direction: 'ltr',
  classesPrefix: 'minimal',
  /** **************************************
   * Css variables
   *************************************** */
  cssVariables: {
    cssVarPrefix: '',
    colorSchemeSelector: 'data-color-scheme',
  },
  /** **************************************
   * Typography
   *************************************** */
  fontFamily: {
    primary: 'Inter',
    secondary: 'Barlow',
  },
  /** **************************************
   * Palette
   *************************************** */
  palette: {
    primary: {
      lighter: '#EBF2FF',
      light: '#919EAB',
      main: '#0067FF',
      dark: '#004FCC',
      darker: '#0052CC',
      contrastText: '#FFFFFF',
    },
    secondary: {
      lighter: '#fff3e0',
      light: '#ffb74d',
      main: '#ff9800',
      dark: '#e68900',
      darker: '#e65100',
      contrastText: '#FFFFFF',
    },
    info: {
      lighter: '#d2eff2',
      light: '#8ed3da',
      main: '#17a2b8',
      dark: '#128293',
      darker: '#0b515b',
      contrastText: '#FFFFFF',
    },
    success: {
      lighter: '#d2eecc',
      light: '#8ed39a',
      main: '#28a745',
      dark: '#1e8236',
      darker: '#145722',
      contrastText: '#ffffff',
    },
    warning: {
      lighter: '#fff8b3',
      light: '#ffe633',
      main: '#ffd100',
      dark: '#ccaa00',
      darker: '#806b00',
      contrastText: '#1C252E',
    },
    error: {
      lighter: '#fad7db',
      light: '#f1979f',
      main: '#dc3545',
      dark: '#b02b37',
      darker: '#741d24',
      contrastText: '#FFFFFF',
    },
    grey: {
      50: '#f9fafb',
      100: '#f9fafb',
      200: '#f4f6f8',
      300: '#dfe3e8',
      400: '#c4cdd5',
      500: '#919eab',
      600: '#637381',
      700: '#454f5b',
      800: '#1c252e',
      900: '#141a21',
    },
    common: {
      black: '#000000',
      white: '#FFFFFF',
    },
  },
};
