import type { Theme, Components } from '@mui/material/styles';



// ----------------------------------------------------------------------

const MuiTooltip: Components<Theme>['MuiTooltip'] = {
  // ▼▼▼▼▼▼▼▼ ⚙️ PROPS ▼▼▼▼▼▼▼▼
  defaultProps: {
    slotProps: {
      popper: {
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, -4],
            },
          },
        ],
      },
    },
  },
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    tooltip: ({ theme }) => ({
      borderRadius: Number(theme.shape.borderRadius) * 0.75,
      backgroundColor: theme.vars.palette.grey[800],
      color: theme.vars.palette.common.white,
    }),
  },
};

/* **********************************************************************
 * 🚀 Export
 * **********************************************************************/
export const tooltip: Components<Theme> = {
  MuiTooltip,
};
