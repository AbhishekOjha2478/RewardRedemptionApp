import { useState } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import PageHeader from '../../components/PageHeader'
import StateBlock from '../../components/StateBlock'
import { getErrorMessage } from '../../lib/errors'
import { formatPoints } from '../../lib/format'
import type { RewardProcessingResult } from '../../types/models'
import { fetchRewardSummary, processRewards } from './api'

export default function RewardProcessingPage() {
  const { customerId } = useParams()
  const id = Number(customerId)
  const queryClient = useQueryClient()

  const [result, setResult] = useState<RewardProcessingResult | null>(null)
  const [processError, setProcessError] = useState<string | null>(null)

  const summaryQuery = useQuery({
    queryKey: ['rewardSummary', id],
    queryFn: () => fetchRewardSummary(id),
  })

  const processMutation = useMutation({
    mutationFn: () => processRewards(id),
    onSuccess: (processed) => {
      setResult(processed)
      setProcessError(null)
      void queryClient.invalidateQueries({ queryKey: ['rewardSummary', id] })
      void queryClient.invalidateQueries({ queryKey: ['customer', id] })
      void queryClient.invalidateQueries({ queryKey: ['cart', id] })
    },
    onError: (error) => {
      setResult(null)
      setProcessError(getErrorMessage(error))
    },
  })

  const summary = summaryQuery.data

  if (!summary) {
    return (
      <Box>
        <PageHeader title="Reward processing" subtitle="Turn transactions into reward points" />
        <StateBlock
          loading={summaryQuery.isPending}
          error={summaryQuery.isError ? summaryQuery.error : undefined}
          errorMessage={summaryQuery.isError ? getErrorMessage(summaryQuery.error) : undefined}
          onRetry={() => void summaryQuery.refetch()}
        />
      </Box>
    )
  }

  const isPremium = summary.customerType === 'PREMIUM'
  const tierSentence = isPremium
    ? `Premium customers earn ${summary.rateApplied} of every transaction as points.`
    : `Regular customers earn ${summary.rateApplied} of every transaction as points.`

  return (
    <Box>
      <PageHeader title="Reward processing" subtitle="Turn transactions into reward points" />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 2,
        }}
      >
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Current balance
            </Typography>
            <Typography variant="h4">{formatPoints(summary.rewardPoints)}</Typography>
            <Typography variant="body2" color="text.secondary">
              points
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Customer type
            </Typography>
            <Chip
              label={summary.customerType}
              color={isPremium ? 'secondary' : 'default'}
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Unprocessed transactions
            </Typography>
            <Typography variant="h4">{formatPoints(summary.unprocessedTransactions)}</Typography>
            <Typography variant="body2" color="text.secondary">
              waiting to be processed
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Earning rate {summary.rateApplied}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {tierSentence} Processing awards points for every transaction that has not been processed
          yet, and each transaction is only ever counted once.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={() => processMutation.mutate()}
          disabled={processMutation.isPending}
          startIcon={processMutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {processMutation.isPending ? 'Processing' : 'Process rewards'}
        </Button>

        {processError && (
          <Alert severity="error" sx={{ mt: 3 }} onClose={() => setProcessError(null)}>
            {processError}
          </Alert>
        )}

        {result !== null &&
          (result.transactionsProcessed === 0 ? (
            <Alert severity="info" sx={{ mt: 3 }} onClose={() => setResult(null)}>
              No new transactions to process. Nothing changed.
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mt: 3 }} onClose={() => setResult(null)}>
              <AlertTitle>Rewards processed</AlertTitle>
              Processed {formatPoints(result.transactionsProcessed)} transactions at{' '}
              {result.rateApplied} and earned {formatPoints(result.pointsEarned)} points. The new
              balance is {formatPoints(result.newBalance)} points.
            </Alert>
          ))}
      </Paper>
    </Box>
  )
}
