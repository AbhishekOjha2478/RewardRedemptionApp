export interface NavItem {
  label: string
  path: string
  adminOnly: boolean
}

export const navItems: NavItem[] = [
  { label: 'Customers', path: '/customers', adminOnly: false },
  { label: 'CES Users', path: '/users', adminOnly: true },
  { label: 'Analytics', path: '/analytics', adminOnly: true },
]
