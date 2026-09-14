import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

interface PlaceholderPageProps {
  title: string
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        Not built yet.
      </Typography>
    </Paper>
  )
}
