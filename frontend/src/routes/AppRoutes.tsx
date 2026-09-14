import { Navigate, Route, Routes } from 'react-router'
import AuthProvider from '../auth/AuthProvider'
import ProtectedRoute from '../auth/ProtectedRoute'
import RoleRoute from '../auth/RoleRoute'
import AppLayout from '../layouts/AppLayout'
import CustomerLayout from '../layouts/CustomerLayout'
import PlaceholderPage from '../components/PlaceholderPage'
import LoginPage from '../features/auth/LoginPage'
import ChangePasswordPage from '../features/auth/ChangePasswordPage'
import CustomerListPage from '../features/customers/CustomerListPage'
import CustomerProfilePage from '../features/customers/CustomerProfilePage'
import CardsPage from '../features/cards/CardsPage'
import TransactionsPage from '../features/transactions/TransactionsPage'
import RewardProcessingPage from '../features/rewards/RewardProcessingPage'
import CatalogPage from '../features/rewards/CatalogPage'
import CartPage from '../features/cart/CartPage'
import CesUserListPage from '../features/users/CesUserListPage'

export default function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/customers" replace />} />
            <Route path="/customers" element={<CustomerListPage />} />

            <Route path="/customers/:customerId" element={<CustomerLayout />}>
              <Route index element={<CustomerProfilePage />} />
              <Route path="cards" element={<CardsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="rewards" element={<RewardProcessingPage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="cart" element={<CartPage />} />
            </Route>

            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/forbidden" element={<PlaceholderPage title="Access denied" />} />

            <Route element={<RoleRoute allow={['ADMIN_CES']} />}>
              <Route path="/users" element={<CesUserListPage />} />
              <Route path="/analytics" element={<PlaceholderPage title="Analytics" />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<PlaceholderPage title="Page not found" />} />
      </Routes>
    </AuthProvider>
  )
}
