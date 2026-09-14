import { Link as RouterLink, Outlet, useLocation, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import StateBlock from '../components/StateBlock'
import { fetchCustomer } from '../features/customers/api'
import { formatDate, formatPoints } from '../lib/format'
import { getErrorMessage } from '../lib/errors'

const tabs = [
  { label: 'Profile', segment: '' },
  { label: 'Cards', segment: 'cards' },
  { label: 'Transactions', segment: 'transactions' },
  { label: 'Rewards', segment: 'rewards' },
  { label: 'Catalog', segment: 'catalog' },
  { label: 'Cart', segment: 'cart' },
]

export default function CustomerLayout() {
  const { customerId } = useParams()
  const id = Number(customerId)
  const location = useLocation()

  const { data: customer, isPending, error, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => fetchCustomer(id),
  })

  const base = `/customers/${id}`
  const rest = location.pathname === base ? '' : location.pathname.replace(`${base}/`, '').split('/')[0]
  const current = tabs.some((tab) => tab.segment === rest) ? rest : ''

  if (isPending || error) {
    return (
      <StateBlock
        loading={isPending}
        error={error}
        errorMessage={error ? getErrorMessage(error) : undefined}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link component={RouterLink} to="/customers" underline="hover" color="inherit">
          Customers
        </Link>
        <Typography color="text.primary">{customer.fullName}</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Box>
            <Typography variant="h5">{customer.fullName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {customer.email} · with the bank since {formatDate(customer.associatedSince)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip
              label={customer.customerType === 'PREMIUM' ? 'Premium' : 'Regular'}
              color={customer.customerType === 'PREMIUM' ? 'secondary' : 'default'}
            />
            <Chip
              label={`${formatPoints(customer.rewardPoints)} points`}
              color="primary"
              variant="outlined"
            />
          </Stack>
        </Stack>
      </Paper>

      <Tabs value={current} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
        {tabs.map((tab) => (
          <Tab
            key={tab.segment}
            value={tab.segment}
            label={tab.label}
            component={RouterLink}
            to={tab.segment ? `${base}/${tab.segment}` : base}
          />
        ))}
      </Tabs>

      <Outlet />
    </Box>
  )
}
