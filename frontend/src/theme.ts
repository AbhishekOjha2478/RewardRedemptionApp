import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: { main: '#0f6e66' },
    secondary: { main: '#8e5b12' },
    background: { default: '#f5f7f6' },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiTextField: {
      defaultProps: { size: 'small', fullWidth: true },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
  },
})

export default theme
