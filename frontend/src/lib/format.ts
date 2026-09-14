const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-IN')

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatCurrency(value: string | number): string {
  return currencyFormatter.format(Number(value))
}

export function formatPoints(value: number): string {
  return numberFormatter.format(value)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-'
  }
  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-'
  }
  return dateTimeFormatter.format(new Date(value))
}
