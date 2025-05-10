import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({ 
  title, 
  buttonText, 
  buttonPath, 
  buttonIcon = <AddIcon />,
  showButton = true
}) => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate(buttonPath);
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}
    >
      <Typography variant="h4" component="h1">
        {title}
      </Typography>
      
      {showButton && buttonPath && (
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={buttonIcon}
          onClick={handleButtonClick}
        >
          {buttonText}
        </Button>
      )}
    </Box>
  );
};

export default PageHeader; 