import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import PageHeader from '../../components/PageHeader'
import StateBlock from '../../components/StateBlock'
import ConfirmDialog from '../../components/ConfirmDialog'
import { createCesUser, deleteCesUser, fetchCesUsers } from './api'
import { useAuth } from '../../auth/useAuth'
import { formatDate } from '../../lib/format'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import type { CesUser } from '../../types/models'

const schema = z.object({
  username: z
    .string()
    .min(4, 'Username must be at least 4 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Letters, digits, dot, dash or underscore only'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a digit'),
  fullName: z.string().min(1, 'Full name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Must be a valid email address'),
})

type CreateUserForm = z.infer<typeof schema>

function deleteHint(isSelf: boolean, isAdministrator: boolean): string {
  if (isSelf) {
    return 'You cannot delete your own account'
  }
  if (isAdministrator) {
    return 'Administrator accounts cannot be deleted'
  }
  return 'Delete user'
}

export default function CesUserListPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<CesUser | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['cesUsers'],
    queryFn: fetchCesUsers,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '', fullName: '', email: '' },
  })

  const creation = useMutation({
    mutationFn: createCesUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cesUsers'] })
      reset()
      setSubmitError(null)
      setCreateOpen(false)
    },
    onError: (mutationError) => {
      const fieldErrors = getFieldErrors(mutationError)
      const entries = Object.entries(fieldErrors)
      if (entries.length > 0) {
        entries.forEach(([field, message]) => {
          if (field in schema.shape) {
            setError(field as keyof CreateUserForm, { message })
          }
        })
      } else {
        setSubmitError(getErrorMessage(mutationError))
      }
    },
  })

  const removal = useMutation({
    mutationFn: deleteCesUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cesUsers'] })
      setPendingDelete(null)
      setDeleteError(null)
    },
    onError: (mutationError) => setDeleteError(getErrorMessage(mutationError)),
  })

  const users = data ?? []

  return (
    <Box>
      <PageHeader
        title="CES users"
        subtitle="Portal accounts. Only an administrator can create or remove CES users."
        action={
          <Button variant="contained" onClick={() => setCreateOpen(true)}>
            New CES user
          </Button>
        }
      />

      {deleteError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError(null)}>
          {deleteError}
        </Alert>
      )}

      <Paper>
        <StateBlock
          loading={isPending}
          error={error}
          errorMessage={error ? getErrorMessage(error) : undefined}
          onRetry={() => refetch()}
          empty={!isPending && !error && users.length === 0}
          emptyMessage="No CES users yet."
        />

        {!isPending && !error && users.length > 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Full name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((cesUser) => {
                  const isSelf = user?.id === cesUser.id
                  const isAdministrator = cesUser.role === 'ADMIN_CES'
                  return (
                    <TableRow key={cesUser.id} hover>
                      <TableCell>{cesUser.username}</TableCell>
                      <TableCell>{cesUser.fullName}</TableCell>
                      <TableCell>{cesUser.email}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={cesUser.role === 'ADMIN_CES' ? 'Admin CES' : 'CES User'}
                          color={cesUser.role === 'ADMIN_CES' ? 'secondary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{formatDate(cesUser.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title={deleteHint(isSelf, isAdministrator)}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={isSelf || isAdministrator}
                              onClick={() => setPendingDelete(cesUser)}
                              aria-label={`Delete ${cesUser.username}`}
                            >
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit((values) => creation.mutate(values))} noValidate>
          <DialogTitle>New CES user</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {submitError && <Alert severity="error">{submitError}</Alert>}
              <TextField
                id="username"
                label="Username"
                error={Boolean(errors.username)}
                helperText={errors.username?.message}
                {...register('username')}
              />
              <TextField
                id="fullName"
                label="Full name"
                error={Boolean(errors.fullName)}
                helperText={errors.fullName?.message}
                {...register('fullName')}
              />
              <TextField
                id="email"
                label="Email"
                type="email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <TextField
                id="password"
                label="Password"
                type="password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message ?? 'At least 8 characters, with a letter and a digit'}
                {...register('password')}
              />
              <Alert severity="info">
                New accounts are always created as CES users. Administrator accounts are not
                created or removed from this screen.
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)} disabled={creation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creation.isPending}>
              {creation.isPending ? 'Creating' : 'Create user'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete CES user"
        message={
          pendingDelete
            ? `${pendingDelete.fullName} will lose access immediately and any active session will be ended.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        busy={removal.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && removal.mutate(pendingDelete.id)}
      />
    </Box>
  )
}
