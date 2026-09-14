import { useState } from 'react'
import { useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import PageHeader from '../../components/PageHeader'
import StateBlock from '../../components/StateBlock'
import { addCard, fetchCards } from './api'
import { formatDate } from '../../lib/format'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'

const schema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be exactly 16 digits'),
  cardType: z.string().max(40),
  expiresOn: z.string().min(1, 'Expiry date is required'),
})

type AddCardForm = z.infer<typeof schema>

export default function CardsPage() {
  const { customerId } = useParams()
  const id = Number(customerId)
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['cards', id],
    queryFn: () => fetchCards(id),
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AddCardForm>({
    resolver: zodResolver(schema),
    defaultValues: { cardNumber: '', cardType: 'Standard', expiresOn: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: AddCardForm) => addCard(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', id] })
      queryClient.invalidateQueries({ queryKey: ['customer', id] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      reset()
      setSubmitError(null)
      setOpen(false)
    },
    onError: (mutationError) => {
      const fieldErrors = getFieldErrors(mutationError)
      const entries = Object.entries(fieldErrors)
      if (entries.length > 0) {
        entries.forEach(([field, message]) => {
          if (field in schema.shape) {
            setError(field as keyof AddCardForm, { message })
          }
        })
      } else if (getErrorMessage(mutationError).includes('already registered')) {
        setError('cardNumber', { message: 'This card number is already registered' })
      } else {
        setSubmitError(getErrorMessage(mutationError))
      }
    },
  })

  const cards = data ?? []
  const minExpiry = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  return (
    <Box>
      <PageHeader
        title="Credit cards"
        subtitle="A customer may hold several cards. Numbers are unique across the bank."
        action={
          <Button variant="contained" onClick={() => setOpen(true)}>
            Add card
          </Button>
        }
      />

      <StateBlock
        loading={isPending}
        error={error}
        errorMessage={error ? getErrorMessage(error) : undefined}
        onRetry={() => refetch()}
        empty={!isPending && !error && cards.length === 0}
        emptyMessage="No cards yet. Add one to start generating transactions."
      />

      {!isPending && !error && cards.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {cards.map((card) => (
            <Card key={card.id} variant="outlined">
              <CardContent>
                <Stack direction="row" sx={{ mb: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip size="small" label={card.cardType ?? 'Standard'} color="secondary" />
                  <Chip
                    size="small"
                    label={card.active ? 'Active' : 'Blocked'}
                    color={card.active ? 'success' : 'default'}
                  />
                </Stack>
                <Typography variant="h6" sx={{ letterSpacing: 1, fontFamily: 'monospace' }}>
                  {card.maskedNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Issued {formatDate(card.issuedOn)} · Expires {formatDate(card.expiresOn)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.transactionCount} transactions
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
          <DialogTitle>Add credit card</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {submitError && <Alert severity="error">{submitError}</Alert>}
              <TextField
                id="cardNumber"
                label="Card number"
                placeholder="16 digits"
                error={Boolean(errors.cardNumber)}
                helperText={errors.cardNumber?.message}
                slotProps={{ htmlInput: { maxLength: 16, inputMode: 'numeric' } }}
                {...register('cardNumber')}
              />
              <TextField
                id="cardType"
                label="Card type"
                error={Boolean(errors.cardType)}
                helperText={errors.cardType?.message ?? 'For example Platinum or Gold'}
                {...register('cardType')}
              />
              <TextField
                id="expiresOn"
                label="Expires on"
                type="date"
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: minExpiry } }}
                error={Boolean(errors.expiresOn)}
                helperText={errors.expiresOn?.message}
                {...register('expiresOn')}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding' : 'Add card'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}
