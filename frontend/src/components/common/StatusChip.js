import React from 'react';
import { Chip } from '@mui/material';

const StatusChip = ({ label, color = 'default', size = 'small' }) => {
  return (
    <Chip 
      label={label}
      color={color}
      size={size}
      variant="filled"
      sx={{ fontWeight: 500 }}
    />
  );
};

export default StatusChip; 