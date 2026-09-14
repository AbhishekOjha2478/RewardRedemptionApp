import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useAuth } from '../../auth/useAuth'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import { changePassword } from './api'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must contain a letter')
      .regex(/\d/, 'Password must contain a digit'),
    confirmPassword: z.string().min(1, 'Please confirm the new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ChangePasswordForm = z.infer<typeof schema>

export default function ChangePasswordPage() {
  const { logout } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: ChangePasswordForm) => {
    setSubmitError(null)
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      setDone(true)
      setTimeout(() => {
        void logout()
      }, 2000)
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      const entries = Object.entries(fieldErrors)
      if (entries.length > 0) {
        entries.forEach(([field, message]) => {
          if (field === 'currentPassword' || field === 'newPassword') {
            setError(field, { message })
          }
        })
      } else {
        setSubmitError(getErrorMessage(error))
      }
    }
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 420 }}>
      <Typography variant="h6" gutterBottom>
        Change password
      </Typography>

      {done ? (
        <Alert severity="success">Password changed. Signing you out so you can sign in again.</Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {submitError && <Alert severity="error">{submitError}</Alert>}

            <TextField
              id="currentPassword"
              label="Current password"
              type="password"
              autoComplete="current-password"
              error={Boolean(errors.currentPassword)}
              helperText={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <TextField
              id="newPassword"
              label="New password"
              type="password"
              autoComplete="new-password"
              error={Boolean(errors.newPassword)}
              helperText={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <TextField
              id="confirmPassword"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? 'Saving' : 'Change password'}
            </Button>
          </Stack>
        </form>
      )}
    </Paper>
  )
}
