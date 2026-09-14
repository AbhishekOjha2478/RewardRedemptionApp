import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import PageHeader from '../../components/PageHeader'
import StateBlock from '../../components/StateBlock'
import { fetchCustomer } from './api'
import { fetchCards } from '../cards/api'
import { fetchRedemptions } from '../cart/api'
import { fetchRewardSummary } from '../rewards/api'
import { formatDate, formatDateTime, formatPoints } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'

export default function CustomerProfilePage() {
  const { customerId } = useParams()
  const id = Number(customerId)

  const customerQuery = useQuery({ queryKey: ['customer', id], queryFn: () => fetchCustomer(id) })
  const cardsQuery = useQuery({ queryKey: ['cards', id], queryFn: () => fetchCards(id) })
  const summaryQuery = useQuery({
    queryKey: ['rewardSummary', id],
    queryFn: () => fetchRewardSummary(id),
  })
  const redemptionsQuery = useQuery({
    queryKey: ['redemptions', id],
    queryFn: () => fetchRedemptions(id, 0, 5),
  })

  if (customerQuery.isPending || customerQuery.error) {
    return (
      <StateBlock
        loading={customerQuery.isPending}
        error={customerQuery.error}
        errorMessage={customerQuery.error ? getErrorMessage(customerQuery.error) : undefined}
        onRetry={() => customerQuery.refetch()}
      />
    )
  }

  const customer = customerQuery.data
  const cards = cardsQuery.data ?? []
  const summary = summaryQuery.data
  const redemptions = redemptionsQuery.data?.content ?? []

  const facts = [
    { label: 'Reward points', value: formatPoints(customer.rewardPoints) },
    { label: 'Customer type', value: customer.customerType === 'PREMIUM' ? 'Premium' : 'Regular' },
    { label: 'Earning rate', value: summary?.rateApplied ?? '-' },
    { label: 'Unprocessed transactions', value: String(summary?.unprocessedTransactions ?? 0) },
  ]

  return (
    <Box>
      <PageHeader title="Profile" subtitle="Everything about this customer in one place" />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {facts.map((fact) => (
          <Card key={fact.label} variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {fact.label}
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.5 }}>
                {fact.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Personal details
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 1.5,
          }}
        >
          <Typography variant="body2">
            <strong>Name</strong> · {customer.fullName}
          </Typography>
          <Typography variant="body2">
            <strong>Email</strong> · {customer.email}
          </Typography>
          <Typography variant="body2">
            <strong>Phone</strong> · {customer.phone ?? '-'}
          </Typography>
          <Typography variant="body2">
            <strong>With the bank since</strong> · {formatDate(customer.associatedSince)} (
            {customer.yearsAssociated} years)
          </Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Credit cards
        </Typography>
        {cards.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No cards yet.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Number</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell align="right">Transactions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{card.maskedNumber}</TableCell>
                    <TableCell>{card.cardType ?? 'Standard'}</TableCell>
                    <TableCell>{formatDate(card.expiresOn)}</TableCell>
                    <TableCell align="right">{card.transactionCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Redemption history
        </Typography>
        {redemptions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nothing redeemed yet.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Reference</TableCell>
                  <TableCell>When</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell align="right">Points</TableCell>
                  <TableCell align="right">Balance after</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {redemptions.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{redemption.reference}</TableCell>
                    <TableCell>{formatDateTime(redemption.redeemedAt)}</TableCell>
                    <TableCell>
                      {redemption.items.map((line) => (
                        <Chip
                          key={line.itemName}
                          size="small"
                          label={`${line.quantity} x ${line.itemName}`}
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell align="right">{formatPoints(redemption.totalPoints)}</TableCell>
                    <TableCell align="right">{formatPoints(redemption.balanceAfter)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  )
}
