import type { Theme, CSSObject, Components, ComponentsVariants } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';

import { buttonClasses } from '@mui/material/Button';

import { colorKeys } from '../palette';

// ----------------------------------------------------------------------

/**
 * TypeScript extension for MUI theme augmentation.
 * @to {@link file://./../../extend-theme-types.d.ts}
 */
export type ButtonExtendSize = { xLarge: true };
export type ButtonExtendVariant = { soft: true; customPrimary: true; customSecondary: true };
export type ButtonExtendColor = { black: true; white: true };

type ButtonVariants = ComponentsVariants<Theme>['MuiButton'];

const baseColors = ['inherit'] as const;
const allColors = [...baseColors, ...colorKeys.palette, ...colorKeys.common] as const;

const DIMENSIONS: Record<'small' | 'medium' | 'large' | 'xLarge', CSSObject> = {
  small: { '--padding-y': '4px', '--padding-x': '8px', minHeight: 30, lineHeight: 22 / 13 },
  medium: { '--padding-y': '6px', '--padding-x': '12px', minHeight: 36, lineHeight: 24 / 14 },
  large: { '--padding-y': '8px', '--padding-x': '16px', minHeight: 48, lineHeight: 26 / 15 },
  xLarge: { minHeight: 56 },
};

/* **********************************************************************
 * 🗳️ Variants
 * **********************************************************************/
const containedVariants = [
  {
    props: (props) => props.variant === 'contained' && props.color === 'inherit',
    style: ({ theme }) => ({
      ...theme.mixins.filledStyles(theme, 'inherit', {
        hover: {
          boxShadow: theme.vars.customShadows.z8,
        },
      }),
    }),
  },
  ...(colorKeys.common.map((colorKey) => ({
    props: (props) => props.variant === 'contained' && props.color === colorKey,
    style: ({ theme }) => ({
      ...theme.mixins.filledStyles(theme, colorKey, {
        hover: {
          boxShadow: theme.vars.customShadows.z8,
        },
      }),
    }),
  })) satisfies ButtonVariants),
  ...(colorKeys.palette.map((colorKey) => ({
    props: (props) => props.variant === 'contained' && props.color === colorKey,
    style: ({ theme }) => ({
      '&:hover': {
        boxShadow: theme.vars.customShadows[colorKey],
      },
    }),
  })) satisfies ButtonVariants),
] satisfies ButtonVariants;

const outlinedVariants = [
  {
    props: (props) => props.variant === 'outlined',
    style: ({ theme }) => ({
      borderColor: varAlpha('currentColor', theme?.vars?.opacity?.outlined?.border ?? 0.48),
      backgroundColor: 'transparent',
      '&:hover': {
        borderColor: 'currentColor',
        backgroundColor: varAlpha('currentColor', 0.08),
        boxShadow: 'none',
      },
      '&:disabled': {
        borderColor: theme.vars.palette.grey[400],
        color: theme.vars.palette.grey[400],
        backgroundColor: 'transparent',
      },
    }),
  },
  {
    props: (props) => props.variant === 'outlined' && props.color === 'inherit',
    style: ({ theme }) => ({
      borderColor: theme.vars.palette.shared.buttonOutlined,
      color: theme.vars.palette.text.primary,
      '&:hover': {
        backgroundColor: varAlpha(theme.vars.palette.text.primary, 0.08),
        borderColor: theme.vars.palette.text.primary,
      },
      '&:disabled': {
        borderColor: theme.vars.palette.grey[400],
        color: theme.vars.palette.grey[400],
        backgroundColor: 'transparent',
      },
    }),
  },
  {
    props: (props) => props.variant === 'outlined' && props.color === 'primary',
    style: ({ theme }) => ({
      color: theme.vars.palette.primary.main,
      borderColor: theme.vars.palette.primary.main,
      '&:hover': {
        backgroundColor: varAlpha(theme.vars.palette.primary.main, 0.08),
        borderColor: theme.vars.palette.primary.main,
      },
      '&:disabled': {
        borderColor: theme.vars.palette.grey[400],
        color: theme.vars.palette.grey[400],
        backgroundColor: 'transparent',
      },
    }),
  },
  {
    props: (props) => props.variant === 'outlined' && props.color === 'info',
    style: ({ theme }) => ({
      color: theme.vars.palette.info.main,
      borderColor: theme.vars.palette.info.main,
      '&:hover': {
        backgroundColor: varAlpha(theme.vars.palette.info.main, 0.08),
        borderColor: theme.vars.palette.info.main,
      },
      '&:disabled': {
        borderColor: theme.vars.palette.grey[400],
        color: theme.vars.palette.grey[400],
        backgroundColor: 'transparent',
      },
    }),
  },
  {
    props: (props) => props.variant === 'outlined' && props.color === 'success',
    style: ({ theme }) => ({
      color: theme.vars.palette.success.main,
      borderColor: theme.vars.palette.success.main,
      '&:hover': {
        backgroundColor: varAlpha(theme.vars.palette.success.main, 0.08),
        borderColor: theme.vars.palette.success.main,
      },
      '&:disabled': {
        borderColor: theme.vars.palette.grey[400],
        color: theme.vars.palette.grey[400],
        backgroundColor: 'transparent',
      },
    }),
  },
  {
    props: (props) => props.variant === 'outlined' && props.color === 'warning',
    style: ({ theme }) => ({
      color: theme.vars.palette.warning.main,
      borderColor: theme.vars.palette.warning.main,
      '&:hover': {
        backgroundColor: varAlpha(theme.vars.palette.warning.main, 0.08),
        borderColor: theme.vars.palette.warning.main,
      },
      '&:disabled': {
        borderColor: theme.vars.palette.grey[400],
        color: theme.vars.palette.grey[400],
        backgroundColor: 'transparent',
      },
    }),
  },
  {
    props: (props) => props.variant === 'outlined' && props.color === 'error',
    style: ({ theme }) => ({
      color: theme.vars.palette.error.main,
      borderColor: theme.vars.palette.error.main,
      '&:hover': {
        backgroundColor: varAlpha(theme.vars.palette.error.main, 0.08),
        borderColor: theme.vars.palette.error.main,
      },
      '&:disabled': {
        borderColor: theme.vars.palette.grey[400],
        color: theme.vars.palette.grey[400],
        backgroundColor: 'transparent',
      },
    }),
  },
  {
    props: (props) => props.variant === 'outlined' && props.color === 'black',
    style: ({ theme }) => ({
      color: theme.vars.palette.common.black,
      borderColor: theme.vars.palette.common.black,
      '&:hover': {
        backgroundColor: varAlpha(theme.vars.palette.common.black, 0.08),
        borderColor: theme.vars.palette.common.black,
      },
      '&:disabled': {
        borderColor: theme.vars.palette.grey[400],
        color: theme.vars.palette.grey[400],
        backgroundColor: 'transparent',
      },
    }),
  },
  ...(colorKeys.common.filter(colorKey => colorKey !== 'black').map((colorKey) => ({
    props: (props) => props.variant === 'outlined' && props.color === colorKey,
    style: ({ theme }) => ({
      color: theme.vars.palette.common[colorKey],
      borderColor: theme.vars.palette.common[colorKey],
      '&:hover': {
        backgroundColor: varAlpha(theme.vars.palette.common[colorKey], 0.08),
        borderColor: theme.vars.palette.common[colorKey],
      },
      '&:disabled': {
        borderColor: theme.vars.palette.grey[400],
        color: theme.vars.palette.grey[400],
        backgroundColor: 'transparent',
      },
    }),
  })) satisfies ButtonVariants),
] satisfies ButtonVariants;

const textVariants = [
  {
    props: (props) => props.variant === 'text',
    style: ({ theme }) => ({
      '&:hover': {
        backgroundColor: varAlpha('currentColor', theme.vars.palette.action.hoverOpacity),
      },
    }),
  },
  {
    props: (props) => props.variant === 'text' && props.color === 'inherit',
    style: ({ theme }) => ({
      '&:hover': {
        backgroundColor: theme.vars.palette.action.hover,
      },
    }),
  },
  ...(colorKeys.common.map((colorKey) => ({
    props: (props) => props.variant === 'text' && props.color === colorKey,
    style: ({ theme }) => ({
      color: theme.vars.palette.common[colorKey],
    }),
  })) satisfies ButtonVariants),
] satisfies ButtonVariants;

const softVariants = [
  ...(allColors.map((colorKey) => ({
    props: (props) => props.variant === 'soft' && props.color === colorKey,
    style: ({ theme }) => ({
      ...theme.mixins.softStyles(theme, colorKey, { hover: true }),
    }),
  })) satisfies ButtonVariants),
] satisfies ButtonVariants;

const sizeVariants = [
  {
    props: {},
    style: { padding: 'var(--padding-y) var(--padding-x)' },
  },
  {
    props: (props) => props.size === 'small',
    style: { ...DIMENSIONS.small },
  },
  {
    props: (props) => props.size === 'medium',
    style: { ...DIMENSIONS.medium },
  },
  {
    props: (props) => props.size === 'large' || props.size === 'xLarge',
    style: { ...DIMENSIONS.large },
  },
  {
    props: (props) => props.size === 'xLarge',
    style: ({ theme }) => ({ ...DIMENSIONS.xLarge, fontSize: theme.typography.pxToRem(15) }),
  },
  {
    props: (props) => props.variant === 'outlined',
    style: {
      paddingTop: 'calc(var(--padding-y) - 4px)',
      paddingBottom: 'calc(var(--padding-y) - 4px)',
    },
  },
  {
    props: (props) => props.variant === 'text',
    style: {
      paddingLeft: 'calc(var(--padding-x) - 4px)',
      paddingRight: 'calc(var(--padding-x) - 4px)',
    },
  },
] satisfies ButtonVariants;

const disabledVariants = [
  {
    props: (props) => props.variant === 'soft',
    style: ({ theme }) => ({
      [`&.${buttonClasses.disabled}`]: {
        backgroundColor: theme.vars.palette.action.disabledBackground,
      },
    }),
  },
] satisfies ButtonVariants;

/* **********************************************************************
 * 🧩 Components
 * **********************************************************************/
const MuiButtonBase: Components<Theme>['MuiButtonBase'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: ({ theme }) => ({
      fontFamily: theme.typography.fontFamily,
    }),
  },
};

const MuiButton: Components<Theme>['MuiButton'] = {
  // ▼▼▼▼▼▼▼▼ ⚙️ PROPS ▼▼▼▼▼▼▼▼
  defaultProps: {
    color: 'inherit',
    disableElevation: true,
  },
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    root: {
      variants: [
        ...containedVariants,
        ...outlinedVariants,
        ...textVariants,
        ...softVariants,
        ...sizeVariants,
        ...disabledVariants,
      ],
    },
  },
};

/* **********************************************************************
 * 🚀 Export
 * **********************************************************************/
export const button: Components<Theme> = {
  MuiButton,
  MuiButtonBase,
};
