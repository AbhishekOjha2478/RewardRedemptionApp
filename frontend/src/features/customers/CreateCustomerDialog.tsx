import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { createCustomer } from './api'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(60),
  lastName: z.string().min(1, 'Last name is required').max(60),
  email: z.string().min(1, 'Email is required').email('Must be a valid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  associatedSince: z.string().min(1, 'Association date is required'),
})

type CreateCustomerForm = z.infer<typeof schema>

interface CreateCustomerDialogProps {
  open: boolean
  onClose: () => void
}

export default function CreateCustomerDialog({ open, onClose }: CreateCustomerDialogProps) {
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateCustomerForm>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', associatedSince: '' },
  })

  const mutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      reset()
      setSubmitError(null)
      onClose()
    },
    onError: (error) => {
      const fieldErrors = getFieldErrors(error)
      const entries = Object.entries(fieldErrors)
      if (entries.length > 0) {
        entries.forEach(([field, message]) => {
          if (field in schema.shape) {
            setError(field as keyof CreateCustomerForm, { message })
          }
        })
      } else {
        setSubmitError(getErrorMessage(error))
      }
    },
  })

  const handleClose = () => {
    reset()
    setSubmitError(null)
    onClose()
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
        <DialogTitle>New customer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {submitError && <Alert severity="error">{submitError}</Alert>}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                id="firstName"
                label="First name"
                error={Boolean(errors.firstName)}
                helperText={errors.firstName?.message}
                {...register('firstName')}
              />
              <TextField
                id="lastName"
                label="Last name"
                error={Boolean(errors.lastName)}
                helperText={errors.lastName?.message}
                {...register('lastName')}
              />
            </Stack>

            <TextField
              id="email"
              label="Email"
              type="email"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email')}
            />

            <TextField
              id="phone"
              label="Phone"
              error={Boolean(errors.phone)}
              helperText={errors.phone?.message ?? 'Ten digits'}
              {...register('phone')}
            />

            <TextField
              id="associatedSince"
              label="Banking with us since"
              type="date"
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
              error={Boolean(errors.associatedSince)}
              helperText={
                errors.associatedSince?.message ??
                'Three years or more makes this customer Premium'
              }
              {...register('associatedSince')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating' : 'Create customer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
