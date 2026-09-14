import { useState } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import RemoveIcon from '@mui/icons-material/Remove'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import ConfirmDialog from '../../components/ConfirmDialog'
import PageHeader from '../../components/PageHeader'
import StateBlock from '../../components/StateBlock'
import { getErrorMessage } from '../../lib/errors'
import { formatDateTime, formatPoints } from '../../lib/format'
import type { Redemption } from '../../types/models'
import {
  clearCart,
  fetchCart,
  fetchRedemptions,
  redeemCart,
  removeCartItem,
  updateCartQuantity,
} from './api'

export default function CartPage() {
  const { customerId } = useParams()
  const id = Number(customerId)
  const queryClient = useQueryClient()

  const [redeemConfirmOpen, setRedeemConfirmOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [receipt, setReceipt] = useState<Redemption | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const cartQuery = useQuery({
    queryKey: ['cart', id],
    queryFn: () => fetchCart(id),
  })

  const redemptionsQuery = useQuery({
    queryKey: ['redemptions', id],
    queryFn: () => fetchRedemptions(id, 0, 5),
  })

  const invalidateAfterRedeem = () => {
    void queryClient.invalidateQueries({ queryKey: ['cart', id] })
    void queryClient.invalidateQueries({ queryKey: ['customer', id] })
    void queryClient.invalidateQueries({ queryKey: ['rewardSummary', id] })
    void queryClient.invalidateQueries({ queryKey: ['redemptions', id] })
  }

  const quantityMutation = useMutation({
    mutationFn: (variables: { cartItemId: number; quantity: number }) =>
      updateCartQuantity(id, variables.cartItemId, variables.quantity),
    onSuccess: () => {
      setActionError(null)
      void queryClient.invalidateQueries({ queryKey: ['cart', id] })
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  })

  const removeMutation = useMutation({
    mutationFn: (cartItemId: number) => removeCartItem(id, cartItemId),
    onSuccess: () => {
      setActionError(null)
      void queryClient.invalidateQueries({ queryKey: ['cart', id] })
    },
    onError: (error) => setActionError(getErrorMessage(error)),
  })

  const clearMutation = useMutation({
    mutationFn: () => clearCart(id),
    onSuccess: () => {
      setActionError(null)
      setClearConfirmOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['cart', id] })
    },
    onError: (error) => {
      setClearConfirmOpen(false)
      setActionError(getErrorMessage(error))
    },
  })

  const redeemMutation = useMutation({
    mutationFn: () => redeemCart(id),
    onSuccess: (redemption) => {
      setActionError(null)
      setRedeemConfirmOpen(false)
      setReceipt(redemption)
      invalidateAfterRedeem()
    },
    onError: (error) => {
      setRedeemConfirmOpen(false)
      setActionError(getErrorMessage(error))
    },
  })

  const cart = cartQuery.data

  if (!cart) {
    return (
      <Box>
        <PageHeader title="Cart and redemption" subtitle="Review the cart and redeem points" />
        <StateBlock
          loading={cartQuery.isPending}
          error={cartQuery.isError ? cartQuery.error : undefined}
          errorMessage={cartQuery.isError ? getErrorMessage(cartQuery.error) : undefined}
          onRetry={() => void cartQuery.refetch()}
        />
      </Box>
    )
  }

  const redemptions = redemptionsQuery.data?.content ?? []
  const busy =
    quantityMutation.isPending ||
    removeMutation.isPending ||
    clearMutation.isPending ||
    redeemMutation.isPending

  return (
    <Box>
      <PageHeader
        title="Cart and redemption"
        subtitle="Review the cart and redeem points"
        action={
          cart.lines.length > 0 ? (
            <Button color="error" onClick={() => setClearConfirmOpen(true)} disabled={busy}>
              Clear cart
            </Button>
          ) : null
        }
      />

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        {cart.lines.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <StateBlock
              empty
              emptyMessage="The cart is empty. Add rewards from the catalog to get started."
            />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Points each</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="right">Line total</TableCell>
                  <TableCell align="right">Remove</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cart.lines.map((line) => (
                  <TableRow key={line.cartItemId} hover>
                    <TableCell>{line.itemName}</TableCell>
                    <TableCell>{line.categoryName}</TableCell>
                    <TableCell align="right">{formatPoints(line.pointsCostEach)}</TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: 'center', justifyContent: 'center' }}
                      >
                        <IconButton
                          size="small"
                          aria-label={`Decrease quantity of ${line.itemName}`}
                          disabled={busy || line.quantity <= 1}
                          onClick={() =>
                            quantityMutation.mutate({
                              cartItemId: line.cartItemId,
                              quantity: line.quantity - 1,
                            })
                          }
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2">{line.quantity}</Typography>
                        <IconButton
                          size="small"
                          aria-label={`Increase quantity of ${line.itemName}`}
                          disabled={busy}
                          onClick={() =>
                            quantityMutation.mutate({
                              cartItemId: line.cartItemId,
                              quantity: line.quantity + 1,
                            })
                          }
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{formatPoints(line.lineTotal)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Remove ${line.itemName}`}
                        disabled={busy}
                        onClick={() => removeMutation.mutate(line.cartItemId)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={1} sx={{ maxWidth: 360 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Cart total
            </Typography>
            <Typography variant="body2">{formatPoints(cart.totalPoints)} points</Typography>
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Available points
            </Typography>
            <Typography variant="body2">{formatPoints(cart.availablePoints)} points</Typography>
          </Stack>
        </Stack>

        {cart.shortfall > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>Catalogue value exceeds the reward points available</AlertTitle>
            This cart costs {formatPoints(cart.totalPoints)} points and the customer has{' '}
            {formatPoints(cart.availablePoints)}. Remove {formatPoints(cart.shortfall)} points worth
            of items, or process more transactions to earn the difference.
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          sx={{ mt: 3 }}
          onClick={() => setRedeemConfirmOpen(true)}
          disabled={!cart.redeemable || cart.shortfall > 0 || busy}
          startIcon={redeemMutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {redeemMutation.isPending ? 'Redeeming' : 'Redeem'}
        </Button>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Recent redemptions
      </Typography>
      <Paper>
        {redemptionsQuery.isPending || redemptionsQuery.isError || redemptions.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <StateBlock
              loading={redemptionsQuery.isPending}
              error={redemptionsQuery.isError ? redemptionsQuery.error : undefined}
              errorMessage={
                redemptionsQuery.isError ? getErrorMessage(redemptionsQuery.error) : undefined
              }
              empty={!redemptionsQuery.isPending && !redemptionsQuery.isError}
              emptyMessage="No redemptions yet."
              onRetry={() => void redemptionsQuery.refetch()}
            />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Reference</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Points</TableCell>
                  <TableCell align="right">Balance after</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {redemptions.map((redemption) => (
                  <TableRow key={redemption.id} hover>
                    <TableCell>{redemption.reference}</TableCell>
                    <TableCell>{formatDateTime(redemption.redeemedAt)}</TableCell>
                    <TableCell align="right">{formatPoints(redemption.totalPoints)}</TableCell>
                    <TableCell align="right">{formatPoints(redemption.balanceAfter)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <ConfirmDialog
        open={redeemConfirmOpen}
        title="Redeem rewards"
        message={`This redeems the whole cart for ${formatPoints(cart.totalPoints)} points. Redemption is all or nothing, so either every item is redeemed or nothing is.`}
        confirmLabel="Redeem"
        busy={redeemMutation.isPending}
        onCancel={() => setRedeemConfirmOpen(false)}
        onConfirm={() => redeemMutation.mutate()}
      />

      <ConfirmDialog
        open={clearConfirmOpen}
        title="Clear cart"
        message="This removes every item from the cart. No points are spent."
        confirmLabel="Clear"
        destructive
        busy={clearMutation.isPending}
        onCancel={() => setClearConfirmOpen(false)}
        onConfirm={() => clearMutation.mutate()}
      />

      <Dialog open={receipt !== null} onClose={() => setReceipt(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Redemption receipt</DialogTitle>
        <DialogContent dividers>
          {receipt && (
            <Stack spacing={2}>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Reference
                </Typography>
                <Typography variant="body2">{receipt.reference}</Typography>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body2">{formatDateTime(receipt.redeemedAt)}</Typography>
              </Stack>

              <Divider />

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Points each</TableCell>
                    <TableCell align="right">Line total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receipt.items.map((line) => (
                    <TableRow key={`${line.itemName}-${line.pointsCostEach}`}>
                      <TableCell>{line.itemName}</TableCell>
                      <TableCell align="right">{line.quantity}</TableCell>
                      <TableCell align="right">{formatPoints(line.pointsCostEach)}</TableCell>
                      <TableCell align="right">{formatPoints(line.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Divider />

              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="subtitle2">Total</Typography>
                <Typography variant="subtitle2">
                  {formatPoints(receipt.totalPoints)} points
                </Typography>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Balance afterwards
                </Typography>
                <Typography variant="body2">
                  {formatPoints(receipt.balanceAfter)} points
                </Typography>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setReceipt(null)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
