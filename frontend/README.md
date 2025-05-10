# Library Management System - Frontend

This is the frontend application for the Library Management System, built with React and Material-UI.

## Features

- User management with Super Admin and Admin roles
- Book inventory management
- Purchase orders and procurement workflow
- Sales processing and tracking
- Financial reports and transaction history
- Responsive design for desktop and mobile use

## Technology Stack

- React 18
- Material-UI (MUI) 5
- React Router 6
- Formik & Yup for form validation
- Axios for API communication
- Chart.js for data visualization

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images and other assets
│   │   ├── layout/      # Layout components (sidebar, navbar)
│   │   ├── books/       # Book-related components
│   │   ├── common/      # Common UI components
│   │   ├── finance/     # Finance-related components
│   │   ├── purchases/   # Purchase-related components
│   │   ├── sales/       # Sales-related components
│   │   └── users/       # User-related components
│   ├── context/         # React contexts (auth)
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── utils/           # Utility functions
│   ├── App.js           # Root App component
│   ├── index.js         # Application entry point
│   └── theme.js         # MUI theme configuration
└── package.json         # Dependencies and scripts
```

## Installation and Setup

1. Make sure the backend is running (see ../backend/README.md)

2. Install dependencies:
   ```
   cd frontend
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Access the application at http://localhost:3000

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Runs unit tests
- `npm eject` - Ejects the configuration (not recommended)

## Authentication

The application uses JWT for authentication. The token is stored in localStorage and is included in the Authorization header for API requests.

Default login:
- Username: admin
- Password: admin123

## Role-Based Access Control

- Super Admin: Can manage all system functions, including user management
- Admin: Can manage books, sales, and purchases, but not other users 