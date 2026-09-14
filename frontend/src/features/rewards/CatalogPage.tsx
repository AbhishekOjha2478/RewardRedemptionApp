import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import PageHeader from '../../components/PageHeader'
import StateBlock from '../../components/StateBlock'
import { getErrorMessage } from '../../lib/errors'
import { formatPoints } from '../../lib/format'
import { addToCart, fetchCart, removeCartItem, updateCartQuantity } from '../cart/api'
import { fetchCatalog } from './api'

export default function CatalogPage() {
  const { customerId } = useParams()
  const id = Number(customerId)
  const queryClient = useQueryClient()

  const [tabIndex, setTabIndex] = useState(0)
  const [addedMessage, setAddedMessage] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  const catalogQuery = useQuery({
    queryKey: ['catalog'],
    queryFn: fetchCatalog,
    staleTime: Infinity,
  })

  const cartQuery = useQuery({
    queryKey: ['cart', id],
    queryFn: () => fetchCart(id),
  })

  const addMutation = useMutation({
    mutationFn: (variables: { rewardItemId: number; itemName: string }) =>
      addToCart(id, variables.rewardItemId, 1),
    onSuccess: (_cart, variables) => {
      setAddError(null)
      setAddedMessage(`${variables.itemName} added to the cart.`)
      void queryClient.invalidateQueries({ queryKey: ['cart', id] })
    },
    onError: (error) => {
      setAddedMessage(null)
      setAddError(getErrorMessage(error))
    },
  })

  const quantityMutation = useMutation({
    mutationFn: (variables: { cartItemId: number; quantity: number }) =>
      updateCartQuantity(id, variables.cartItemId, variables.quantity),
    onSuccess: () => {
      setAddError(null)
      void queryClient.invalidateQueries({ queryKey: ['cart', id] })
    },
    onError: (error) => setAddError(getErrorMessage(error)),
  })

  const removeMutation = useMutation({
    mutationFn: (cartItemId: number) => removeCartItem(id, cartItemId),
    onSuccess: () => {
      setAddError(null)
      void queryClient.invalidateQueries({ queryKey: ['cart', id] })
    },
    onError: (error) => setAddError(getErrorMessage(error)),
  })

  const categories = catalogQuery.data ?? []

  if (categories.length === 0) {
    return (
      <Box>
        <PageHeader title="Reward catalog" subtitle="Browse rewards and build a cart" />
        <StateBlock
          loading={catalogQuery.isPending}
          error={catalogQuery.isError ? catalogQuery.error : undefined}
          errorMessage={catalogQuery.isError ? getErrorMessage(catalogQuery.error) : undefined}
          empty={!catalogQuery.isPending && !catalogQuery.isError}
          emptyMessage="The reward catalog is empty."
          onRetry={() => void catalogQuery.refetch()}
        />
      </Box>
    )
  }

  const safeIndex = tabIndex < categories.length ? tabIndex : 0
  const category = categories[safeIndex]
  const availablePoints = cartQuery.data?.availablePoints ?? 0
  const cartLines = cartQuery.data?.lines ?? []
  const busy = addMutation.isPending || quantityMutation.isPending || removeMutation.isPending

  const handleTabChange = (_event: SyntheticEvent, value: number) => {
    setTabIndex(value)
  }

  const handleAdd = (rewardItemId: number, itemName: string) => {
    addMutation.mutate({ rewardItemId, itemName })
  }

  return (
    <Box>
      <PageHeader
        title="Reward catalog"
        subtitle={`Available balance ${formatPoints(availablePoints)} points`}
      />

      {addError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAddError(null)}>
          {addError}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={safeIndex}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {categories.map((item) => (
            <Tab key={item.id} label={item.name} />
          ))}
        </Tabs>
      </Paper>

      {category.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {category.description}
        </Typography>
      )}

      {category.items.length === 0 ? (
        <StateBlock empty emptyMessage="No rewards in this category." />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {category.items.map((item) => {
            const affordable = item.pointsCost <= availablePoints
            const shortBy = item.pointsCost - availablePoints
            const line = cartLines.find((cartLine) => cartLine.rewardItemId === item.id)

            return (
              <Card key={item.id} variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {item.name}
                  </Typography>
                  {item.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {item.description}
                    </Typography>
                  )}
                  <Typography
                    variant="h6"
                    sx={{ color: affordable ? 'secondary.main' : 'text.disabled', fontWeight: 600 }}
                  >
                    {formatPoints(item.pointsCost)}
                    <Typography component="span" variant="body2" sx={{ ml: 0.5, color: 'text.secondary' }}>
                      points
                    </Typography>
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  {line ? (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        border: 1,
                        borderColor: 'primary.main',
                        borderRadius: 1,
                        px: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={busy}
                        aria-label={line.quantity === 1 ? `Remove ${item.name}` : `Decrease ${item.name}`}
                        onClick={() =>
                          line.quantity === 1
                            ? removeMutation.mutate(line.cartItemId)
                            : quantityMutation.mutate({
                                cartItemId: line.cartItemId,
                                quantity: line.quantity - 1,
                              })
                        }
                      >
                        {line.quantity === 1 ? (
                          <DeleteOutlinedIcon fontSize="small" />
                        ) : (
                          <RemoveIcon fontSize="small" />
                        )}
                      </IconButton>
                      <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>
                        {line.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={busy || line.quantity >= 20}
                        aria-label={`Increase ${item.name}`}
                        onClick={() =>
                          quantityMutation.mutate({
                            cartItemId: line.cartItemId,
                            quantity: line.quantity + 1,
                          })
                        }
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : affordable ? (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleAdd(item.id, item.name)}
                      disabled={busy}
                    >
                      Add to cart
                    </Button>
                  ) : (
                    <Tooltip title={`Costs ${formatPoints(shortBy)} points more than this customer has available`}>
                      <span>
                        <Button size="small" variant="outlined" disabled>
                          Add to cart
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            )
          })}
        </Box>
      )}

      <Snackbar
        open={addedMessage !== null}
        autoHideDuration={3000}
        onClose={() => setAddedMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setAddedMessage(null)}>
          {addedMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
