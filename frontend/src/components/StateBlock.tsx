import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

interface StateBlockProps {
  loading?: boolean
  error?: unknown
  errorMessage?: string
  empty?: boolean
  emptyMessage?: string
  onRetry?: () => void
}

export default function StateBlock({
  loading,
  error,
  errorMessage,
  empty,
  emptyMessage,
  onRetry,
}: StateBlockProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          ) : null
        }
      >
        {errorMessage ?? 'Something went wrong.'}
      </Alert>
    )
  }

  if (empty) {
    return (
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyMessage ?? 'Nothing here yet.'}</Typography>
      </Box>
    )
  }

  return null
}
