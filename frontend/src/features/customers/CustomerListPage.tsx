import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import ClearIcon from '@mui/icons-material/Clear'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import SearchIcon from '@mui/icons-material/Search'
import PageHeader from '../../components/PageHeader'
import StateBlock from '../../components/StateBlock'
import ConfirmDialog from '../../components/ConfirmDialog'
import CreateCustomerDialog from './CreateCustomerDialog'
import { deleteCustomer, fetchCustomers } from './api'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { formatDate, formatPoints } from '../../lib/format'
import { getErrorMessage } from '../../lib/errors'
import type { Customer } from '../../types/models'

export default function CustomerListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Customer | null>(null)

  const search = useDebouncedValue(searchInput, 400)
  const term = search.trim()

  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ['customers', { term, page, size }],
    queryFn: () => fetchCustomers({ q: term, page, size }),
    placeholderData: keepPreviousData,
  })

  const removal = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setPendingDelete(null)
    },
  })

  const onSearchChange = (value: string) => {
    setSearchInput(value)
    setPage(0)
  }

  const rows = data?.content ?? []

  return (
    <Box>
      <PageHeader
        title="Customers"
        subtitle="Search by name or credit card number"
        action={
          <Button variant="contained" onClick={() => setCreateOpen(true)}>
            New customer
          </Button>
        }
      />

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          id="customerSearch"
          placeholder="Search customers"
          value={searchInput}
          onChange={(event) => onSearchChange(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => onSearchChange('')} aria-label="Clear search">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
      </Paper>

      <Paper>
        {isFetching && !isPending && <LinearProgress />}

        <StateBlock
          loading={isPending}
          error={error}
          errorMessage={error ? getErrorMessage(error) : undefined}
          onRetry={() => refetch()}
          empty={!isPending && !error && rows.length === 0}
          emptyMessage={
            term ? `No customers match "${term}"` : 'No customers yet. Create the first one.'
          }
        />

        {!isPending && !error && rows.length > 0 && (
          <>
            <TableContainer sx={{ opacity: isFetching ? 0.6 : 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>With us since</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Cards</TableCell>
                    <TableCell align="right">Points</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((customer) => (
                    <TableRow
                      key={customer.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <TableCell>{customer.fullName}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>
                        {formatDate(customer.associatedSince)}
                        <Box component="span" sx={{ color: 'text.secondary', ml: 1 }}>
                          ({customer.yearsAssociated}y)
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={customer.customerType === 'PREMIUM' ? 'Premium' : 'Regular'}
                          color={customer.customerType === 'PREMIUM' ? 'secondary' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">{customer.creditCardCount}</TableCell>
                      <TableCell align="right">{formatPoints(customer.rewardPoints)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Delete customer">
                          <IconButton
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation()
                              setPendingDelete(customer)
                            }}
                            aria-label={`Delete ${customer.fullName}`}
                          >
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={data?.totalElements ?? 0}
              page={page}
              rowsPerPage={size}
              rowsPerPageOptions={[10, 25, 50]}
              onPageChange={(_event, nextPage) => setPage(nextPage)}
              onRowsPerPageChange={(event) => {
                setSize(Number(event.target.value))
                setPage(0)
              }}
            />
          </>
        )}
      </Paper>

      <CreateCustomerDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete customer"
        message={
          pendingDelete
            ? `${pendingDelete.fullName} will be hidden from the portal. Their cards, transactions and redemption history are kept.`
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
