export type Role = 'ADMIN_CES' | 'CES_USER'

export type CustomerType = 'REGULAR' | 'PREMIUM'

export interface AuthUser {
  id: number
  username: string
  fullName: string
  role: Role
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface CesUser {
  id: number
  username: string
  fullName: string
  email: string
  role: Role
  active: boolean
  createdAt: string
}

export interface Customer {
  id: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string | null
  associatedSince: string
  yearsAssociated: number
  customerType: CustomerType
  rewardPoints: number
  creditCardCount: number
}

export interface CreditCard {
  id: number
  maskedNumber: string
  cardType: string | null
  issuedOn: string
  expiresOn: string
  active: boolean
  transactionCount: number
}

export interface Transaction {
  id: number
  amount: string
  transactionDate: string
  merchant: string | null
  category: string | null
  processed: boolean
  pointsAwarded: number
  appliedCustomerType: CustomerType | null
}

export interface RewardItem {
  id: number
  name: string
  description: string | null
  pointsCost: number
  categoryId: number
  categoryName: string
}

export interface RewardCategory {
  id: number
  name: string
  description: string | null
  items: RewardItem[]
}

export interface CartLine {
  cartItemId: number
  rewardItemId: number
  itemName: string
  categoryName: string
  pointsCostEach: number
  quantity: number
  lineTotal: number
}

export interface Cart {
  customerId: number
  lines: CartLine[]
  totalPoints: number
  availablePoints: number
  shortfall: number
  redeemable: boolean
}

export interface RedemptionLine {
  itemName: string
  categoryName: string
  quantity: number
  pointsCostEach: number
  lineTotal: number
}

export interface Redemption {
  id: number
  reference: string
  totalPoints: number
  balanceAfter: number
  redeemedAt: string
  redeemedBy: string | null
  items: RedemptionLine[]
}

export interface RewardSummary {
  customerId: number
  customerType: CustomerType
  rateApplied: string
  rewardPoints: number
  unprocessedTransactions: number
}

export interface RewardProcessingResult {
  customerId: number
  customerType: CustomerType
  rateApplied: string
  transactionsProcessed: number
  pointsEarned: number
  newBalance: number
}
