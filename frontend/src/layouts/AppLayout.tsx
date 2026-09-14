import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router'
import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import { navItems } from './navItems'
import BrandMark from '../components/BrandMark'
import { useAuth } from '../auth/useAuth'

const drawerWidth = 220

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAdmin, logout } = useAuth()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const openMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const closeMenu = () => setAnchorEl(null)

  const initials = user
    ? user.fullName
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : ''

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          <BrandMark size={30} />
          <Box sx={{ flexGrow: 1 }} />
          {user && (
            <Chip
              label={user.role === 'ADMIN_CES' ? 'Admin CES' : 'CES User'}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'inherit' }}
            />
          )}
          <Tooltip title={user?.fullName ?? ''}>
            <IconButton onClick={openMenu} size="small" aria-label="Account menu">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
            <MenuItem
              onClick={() => {
                closeMenu()
                navigate('/change-password')
              }}
            >
              Change password
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeMenu()
                void logout()
              }}
            >
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List>
          {visibleItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={location.pathname.startsWith(item.path)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: `calc(100% - ${drawerWidth}px)` }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
