import { useState } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import type { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import StateBlock from '../../components/StateBlock'
import { getErrorMessage } from '../../lib/errors'
import { formatCurrency, formatDateTime, formatPoints } from '../../lib/format'
import { fetchCards } from '../cards/api'
import { fetchTransactions, generateTransactions } from './api'

export default function TransactionsPage() {
  const { customerId } = useParams()
  const id = Number(customerId)
  const queryClient = useQueryClient()

  const [selectedCardId, setSelectedCardId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [generatedCount, setGeneratedCount] = useState<number | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const cardsQuery = useQuery({
    queryKey: ['cards', id],
    queryFn: () => fetchCards(id),
  })

  const cards = cardsQuery.data ?? []
  const activeCard = cards.find((card) => card.id === selectedCardId) ?? cards[0]
  const activeCardId = activeCard ? activeCard.id : null

  const transactionsQuery = useQuery({
    queryKey: ['transactions', activeCardId, page, size],
    queryFn: () => fetchTransactions(activeCardId as number, page, size),
    enabled: activeCardId !== null,
  })

  const generateMutation = useMutation({
    mutationFn: () => generateTransactions(activeCardId as number),
    onSuccess: (created) => {
      setGeneratedCount(created.length)
      setGenerateError(null)
      setConfirmOpen(false)
      setPage(0)
      void queryClient.invalidateQueries({ queryKey: ['transactions', activeCardId] })
      void queryClient.invalidateQueries({ queryKey: ['cards', id] })
      void queryClient.invalidateQueries({ queryKey: ['rewardSummary', id] })
    },
    onError: (error) => {
      setGeneratedCount(null)
      setGenerateError(getErrorMessage(error))
      setConfirmOpen(false)
    },
  })

  const handleCardChange = (event: SelectChangeEvent) => {
    setSelectedCardId(Number(event.target.value))
    setPage(0)
    setGeneratedCount(null)
  }

  const handlePageChange = (_event: MouseEvent<HTMLButtonElement> | null, nextPage: number) => {
    setPage(nextPage)
  }

  const handleRowsPerPageChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSize(Number(event.target.value))
    setPage(0)
  }

  if (cardsQuery.isPending || cardsQuery.isError) {
    return (
      <Box>
        <PageHeader title="Transactions" subtitle="Card activity and generated sample data" />
        <StateBlock
          loading={cardsQuery.isPending}
          error={cardsQuery.isError ? cardsQuery.error : undefined}
          errorMessage={cardsQuery.isError ? getErrorMessage(cardsQuery.error) : undefined}
          onRetry={() => void cardsQuery.refetch()}
        />
      </Box>
    )
  }

  if (cards.length === 0) {
    return (
      <Box>
        <PageHeader title="Transactions" subtitle="Card activity and generated sample data" />
        <Paper sx={{ p: 3 }}>
          <StateBlock
            empty
            emptyMessage="This customer has no credit cards. Add a card first, then transactions can be recorded against it."
          />
        </Paper>
      </Box>
    )
  }

  const transactions = transactionsQuery.data?.content ?? []
  const totalElements = transactionsQuery.data?.totalElements ?? 0

  return (
    <Box>
      <PageHeader title="Transactions" subtitle="Card activity and generated sample data" />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { sm: 'center' } }}
        >
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel id="card-select-label">Credit card</InputLabel>
            <Select
              labelId="card-select-label"
              id="card-select"
              label="Credit card"
              value={activeCardId === null ? '' : String(activeCardId)}
              onChange={handleCardChange}
            >
              {cards.map((card) => (
                <MenuItem key={card.id} value={String(card.id)}>
                  {card.maskedNumber}
                  {card.cardType ? ` - ${card.cardType}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="outlined"
            onClick={() => setConfirmOpen(true)}
            disabled={activeCardId === null || generateMutation.isPending}
            startIcon={
              generateMutation.isPending ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            Generate 50 transactions
          </Button>
        </Stack>

        {generatedCount !== null && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setGeneratedCount(null)}>
            Created {formatPoints(generatedCount)} sample transactions on this card.
          </Alert>
        )}

        {generateError && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setGenerateError(null)}>
            {generateError}
          </Alert>
        )}
      </Paper>

      <Paper>
        {transactionsQuery.isPending || transactionsQuery.isError || transactions.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <StateBlock
              loading={transactionsQuery.isPending}
              error={transactionsQuery.isError ? transactionsQuery.error : undefined}
              errorMessage={
                transactionsQuery.isError ? getErrorMessage(transactionsQuery.error) : undefined
              }
              empty={!transactionsQuery.isPending && !transactionsQuery.isError}
              emptyMessage="No transactions on this card yet. Generate some sample data to get started."
              onRetry={() => void transactionsQuery.refetch()}
            />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Merchant</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Points earned</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>{formatDateTime(transaction.transactionDate)}</TableCell>
                    <TableCell>{transaction.merchant ?? '-'}</TableCell>
                    <TableCell>{transaction.category ?? '-'}</TableCell>
                    <TableCell align="right">{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={transaction.processed ? 'Processed' : 'Pending'}
                        color={transaction.processed ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {transaction.pointsAwarded === 0 ? '-' : formatPoints(transaction.pointsAwarded)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          rowsPerPage={size}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      <ConfirmDialog
        open={confirmOpen}
        title="Generate sample transactions"
        message="This creates 50 sample transactions on the selected card for demonstration purposes. They are not real purchases and they will count towards reward processing."
        confirmLabel="Generate"
        busy={generateMutation.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => generateMutation.mutate()}
      />
    </Box>
  )
}
