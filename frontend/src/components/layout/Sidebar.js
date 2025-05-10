import React from 'react';
import { 
  Drawer, 
  List, 
  Divider, 
  IconButton, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  styled 
} from '@mui/material';
import { 
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  MenuBook as MenuBookIcon,
  ShoppingCart as ShoppingCartIcon,
  PointOfSale as PointOfSaleIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const Sidebar = ({ open, toggleDrawer }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      allowedRoles: ['super_admin', 'admin']
    },
    { 
      text: 'Books', 
      icon: <MenuBookIcon />, 
      path: '/books',
      allowedRoles: ['super_admin', 'admin']
    },
    { 
      text: 'Purchases', 
      icon: <ShoppingCartIcon />, 
      path: '/purchases',
      allowedRoles: ['super_admin', 'admin']
    },
    { 
      text: 'Sales', 
      icon: <PointOfSaleIcon />, 
      path: '/sales',
      allowedRoles: ['super_admin', 'admin']
    },
    { 
      text: 'Finance', 
      icon: <AttachMoneyIcon />, 
      path: '/finance',
      allowedRoles: ['super_admin', 'admin']
    },
    { 
      text: 'Users', 
      icon: <PeopleIcon />, 
      path: '/users',
      allowedRoles: ['super_admin']
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <DrawerHeader>
        <IconButton onClick={toggleDrawer}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        {menuItems.map((item) => (
          // Only show menu items for which the user has the required role
          (item.allowedRoles.includes('admin') || 
           (user?.is_super_admin && item.allowedRoles.includes('super_admin'))) && (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => handleNavigation(item.path)}>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar; 