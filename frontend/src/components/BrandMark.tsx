import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface BrandMarkProps {
  size?: number
  showSubtitle?: boolean
  color?: string
}

export default function BrandMark({ size = 32, showSubtitle = false, color = 'inherit' }: BrandMarkProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box component="img" src="/logo.svg" alt="" width={size} height={size} sx={{ display: 'block' }} />
      <Box sx={{ lineHeight: 1 }}>
        <Typography
          component="span"
          sx={{
            display: 'block',
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 600,
            fontSize: size * 0.56,
            letterSpacing: '0.06em',
            color,
          }}
        >
          AURUM
        </Typography>
        {showSubtitle && (
          <Typography
            component="span"
            sx={{
              display: 'block',
              fontSize: size * 0.26,
              letterSpacing: '0.22em',
              opacity: 0.75,
              mt: 0.3,
              color,
            }}
          >
            CES PORTAL
          </Typography>
        )}
      </Box>
    </Box>
  )
}
