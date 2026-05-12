# EasyCart Admin Panel

A modern, feature-rich React-based admin dashboard for managing the EasyCart e-commerce platform. Built with Vite, Tailwind CSS, and Firebase for a seamless administrative experience.

![React](https://img.shields.io/badge/React-19.2.5-blue)
![Vite](https://img.shields.io/badge/Vite-8.0.10-brightgreen)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.2.4-38B2AC)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-FFA500)

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Key Features & Modules](#key-features--modules)
- [Authentication & Authorization](#authentication--authorization)
- [Database Schema](#database-schema)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Features
- 🔐 **Role-Based Access Control** - Super Admin and Admin roles with different permissions
- 📊 **Interactive Dashboard** - Real-time analytics with charts and KPIs
- 📦 **Product Management** - CRUD operations for products and inventory
- 🏷️ **Category Management** - Organize products into categories
- 👥 **Customer Management** - View and manage customer information
- 📋 **Order Management** - Process and track customer orders
- 📤 **Bulk Import** - Import data in bulk using Excel files (XLSX)
- 👨‍💼 **Admin Management** - Super Admin can manage other admin users (Super Admin only)
- 🔒 **Protected Routes** - Secure pages with authentication guards
- 📈 **Data Visualization** - Interactive charts using Recharts
- 🎨 **Responsive Design** - Mobile-friendly UI with Tailwind CSS

### Technical Features
- ⚡ **Fast Development** - Vite for instant HMR (Hot Module Replacement)
- 🔄 **Real-time Sync** - Firebase Realtime Database integration
- 🔑 **Secure Authentication** - Firebase Authentication with email/password
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- 🎯 **Clean Architecture** - Organized component and context structure

## 📁 Project Structure

```
EasyCart Admin Panel/
├── src/
│   ├── components/
│   │   ├── DashboardLayout.jsx      # Main layout wrapper with sidebar
│   │   ├── ProtectedRoute.jsx       # Auth guard for protected pages
│   │   ├── RoleRoute.jsx            # Role-based access control wrapper
│   │   ├── Sidebar.jsx              # Navigation menu
│   │   └── Topbar.jsx               # Top navigation bar
│   │
│   ├── context/
│   │   └── AuthContext.jsx          # Global authentication state
│   │
│   ├── pages/
│   │   ├── Login.jsx                # Authentication page
│   │   ├── Dashboard.jsx            # Analytics dashboard
│   │   ├── Categories.jsx           # Category management
│   │   ├── Products.jsx             # Product inventory
│   │   ├── Customers.jsx            # Customer database
│   │   ├── Orders.jsx               # Order processing
│   │   ├── BulkImport.jsx           # Data import utility
│   │   └── Admins.jsx               # Admin user management
│   │
│   ├── App.jsx                      # Main routing configuration
│   ├── firebase.js                  # Firebase initialization
│   ├── main.jsx                     # React entry point
│   ├── App.css                      # App-specific styles
│   └── index.css                    # Global styles
│
├── public/                          # Static assets
├── index.html                       # HTML entry point
├── package.json                     # Project dependencies
├── vite.config.js                   # Vite configuration
├── eslint.config.js                 # ESLint rules
├── firestore.rules                  # Firebase security rules
└── README.md                        # Documentation
```

## 🛠 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.5 | UI Framework |
| React Router DOM | 7.14.2 | Client-side routing |
| Vite | 8.0.10 | Build tool & dev server |
| Tailwind CSS | 4.2.4 | Utility-first CSS framework |
| Firebase | 12.12.1 | Authentication & Database |
| Recharts | 3.8.1 | Data visualization charts |
| XLSX | 0.18.5 | Excel file processing |
| ESLint | 10.2.1 | Code quality linting |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn**
- **Git** (for version control)
- A **Firebase project** with Realtime Database enabled

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "EasyCart Admin Panel"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   or with yarn:
   ```bash
   yarn install
   ```

3. **Verify Firebase Configuration**
   The Firebase config is already set up in `src/firebase.js`. The project uses:
   - Firebase Authentication (email/password)
   - Firebase Realtime Database

## ⚙️ Configuration

### Firebase Setup

The project is pre-configured with Firebase credentials in `src/firebase.js`. If you need to update the configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Database Rules

Update `firestore.rules` with your security rules. Current setup expects:
- `admins/{uid}/` - Admin user data with role field
- `categories/` - Product categories
- `products/` - Product inventory
- `customers/` - Customer information
- `orders/` - Customer orders

## ▶️ Running the Application

### Development Mode
```bash
npm run dev
```
The app will be available at `http://localhost:5173` (Vite default)

### Production Build
```bash
npm run build
```
This creates an optimized build in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## 🎯 Key Features & Modules

### 1. **Authentication (Login.jsx)**
- Email and password-based login
- Firebase Authentication integration
- Automatic redirect to dashboard after login
- Session persistence

### 2. **Dashboard (Dashboard.jsx)**
- Real-time KPI metrics
- Sales trends visualization
- Order statistics with charts
- Monthly revenue analytics using Recharts
- Data fetched from Firebase Realtime Database

### 3. **Product Management (Products.jsx)**
- View all products
- Create new products
- Edit product details
- Delete products
- Manage inventory

### 4. **Category Management (Categories.jsx)**
- Organize products into categories
- Create/edit/delete categories
- Category-product mapping

### 5. **Customer Management (Customers.jsx)**
- View customer information
- Customer purchase history
- Customer statistics

### 6. **Order Management (Orders.jsx)**
- View all orders
- Order status tracking
- Order details and customer info
- Order processing workflow

### 7. **Bulk Import (BulkImport.jsx)**
- Import data from Excel files (XLSX format)
- Supports multiple data types
- Data validation before upload
- Error reporting for failed imports

### 8. **Admin Management (Admins.jsx)**
- Create new admin accounts (Super Admin only)
- Assign roles to admins
- Manage admin permissions
- Deactivate admin accounts

## 🔐 Authentication & Authorization

### Role-Based Access Control (RBAC)

The application implements two-tier role system:

#### **Super Admin**
- Full access to all features
- Can manage other admin users
- Can create, edit, delete any resource
- Access to Admin Management page

#### **Admin**
- Limited access to data management
- Cannot create or manage other admins
- Can manage products, categories, customers, orders
- Can perform bulk imports

### Protected Routes

All routes (except login) are protected by `ProtectedRoute` component which:
- Checks authentication status
- Redirects unauthenticated users to login
- Maintains user session

Role-specific routes use `RoleRoute` component which:
- Verifies user role
- Blocks unauthorized access
- Displays error message for insufficient permissions

## 📊 Database Schema

### Firebase Realtime Database Structure

```
root/
├── admins/
│   └── {uid}/
│       ├── role: "super_admin" | "admin"
│       └── email: string
│
├── categories/
│   └── {categoryId}/
│       ├── name: string
│       ├── description: string
│       └── image: string (URL)
│
├── products/
│   └── {productId}/
│       ├── name: string
│       ├── category: string
│       ├── price: number
│       ├── stock: number
│       ├── description: string
│       └── image: string (URL)
│
├── customers/
│   └── {customerId}/
│       ├── name: string
│       ├── email: string
│       ├── phone: string
│       ├── address: string
│       └── joinDate: timestamp
│
└── orders/
    └── {orderId}/
        ├── customerId: string
        ├── items: array
        ├── totalAmount: number
        ├── status: string
        └── createdAt: timestamp
```

## 📝 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Start development server with HMR |
| Build | `npm run build` | Create optimized production build |
| Preview | `npm run preview` | Preview production build locally |
| Lint | `npm run lint` | Run ESLint to check code quality |

## 🐛 Troubleshooting

### Issue: "No document found in the 'admins' node"
**Solution**: Ensure the Firebase Realtime Database has the admin user UID under the `admins` node with a role field.

```javascript
// Expected structure in Firebase RTDB
{
  "admins": {
    "user_uid_here": {
      "role": "super_admin",
      "email": "admin@example.com"
    }
  }
}
```

### Issue: Firebase Authentication Errors
- Verify Firebase credentials in `src/firebase.js`
- Check Firebase project settings in Firebase Console
- Ensure Realtime Database is enabled

### Issue: Vite Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Chart Data Not Displaying
- Verify data structure in Firebase Realtime Database
- Check browser console for errors
- Ensure proper data formatting (dates, numbers)

## 📚 Component Usage Examples

### Using AuthContext
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { currentUser, userRole } = useAuth();
  
  return (
    <div>
      <p>User: {currentUser?.email}</p>
      <p>Role: {userRole}</p>
    </div>
  );
}
```

### Using Protected Routes
```javascript
<Route element={
  <ProtectedRoute>
    <DashboardLayout />
  </ProtectedRoute>
}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

### Role-Based Routes
```javascript
<Route path="/admins" element={
  <RoleRoute allowedRoles={['super_admin']}>
    <Admins />
  </RoleRoute>
} />
```

## 🌐 Environment Variables

Create a `.env` file in the root directory (optional, Firebase config is hardcoded):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## 📦 Dependencies Overview

### Core Dependencies
- **firebase**: Backend services (Auth, Realtime DB)
- **react**: UI library
- **react-dom**: React DOM rendering
- **react-router-dom**: Client-side routing

### UI & Styling
- **tailwindcss**: Utility-first CSS framework
- **recharts**: Composable charting library

### Utilities
- **xlsx**: Excel file parsing and generation

## 🎨 Styling

The project uses **Tailwind CSS** for styling. Key configuration files:
- `tailwind.config.js` - Tailwind configuration
- `src/index.css` - Global styles with Tailwind directives
- `src/App.css` - Application-specific styles

Tailwind provides utility classes for responsive design:
- `md:` - Medium screens and up
- `lg:` - Large screens and up
- `sm:` - Small screens

## 🔄 Data Flow

```
Login Page
    ↓
Authentication (Firebase Auth)
    ↓
AuthContext stores user & role
    ↓
Protected Routes verify auth
    ↓
Role Routes verify role
    ↓
Dashboard Layout renders
    ↓
Page Components fetch data from Firebase
    ↓
Display data to user
```

## 🚀 Performance Tips

1. **Lazy Load Routes** - Consider code splitting with React.lazy()
2. **Optimize Images** - Compress product and category images
3. **Cache Frequently Used Data** - Implement local caching strategies
4. **Minimize Bundle Size** - Tree-shake unused code in production build
5. **Use Recharts Efficiently** - Limit chart redraws with useMemo

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📄 License

This project is proprietary to EasyCart. All rights reserved.

## 📞 Support & Contact

For issues, questions, or feature requests:
- Create an issue in the project repository
- Contact the development team
- Check Firebase documentation: https://firebase.google.com/docs

## 🔒 Security Notes

- Never commit sensitive credentials to version control
- Use environment variables for Firebase config in production
- Implement proper Firebase Security Rules
- Regularly update dependencies for security patches
- Validate all user inputs on frontend and backend

## 📊 Project Statistics

- **Total Pages**: 8 (Dashboard, Products, Categories, Customers, Orders, Bulk Import, Admins, Login)
- **Total Components**: 5 (DashboardLayout, Sidebar, Topbar, ProtectedRoute, RoleRoute)
- **Authentication**: Firebase Email/Password
- **Database**: Firebase Realtime Database
- **UI Framework**: React 19.2.5 with Tailwind CSS

## 🎯 Future Enhancements

- [ ] Add email notifications for orders
- [ ] Implement order tracking
- [ ] Add inventory alerts
- [ ] Create custom reports
- [ ] Implement payment gateway integration
- [ ] Add multi-language support
- [ ] Implement audit logging
- [ ] Add dark mode support
- [ ] Create API documentation
- [ ] Add unit and integration tests

---

**Last Updated**: May 2026  
**Version**: 1.0.0  
**Status**: Active Development

