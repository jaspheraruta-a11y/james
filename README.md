# PermitHub - Government Permit Management System

A modern, full-featured permit management system built with React, TypeScript, Vite, and Supabase. This application streamlines the process of applying for, managing, and reviewing various government permits including Building Permits, Business Permits, and Motorela Permits.

## Features

### For Citizens
- **User Registration & Authentication** - Secure account creation with username/email login
- **Permit Applications** - Apply for multiple permit types with detailed forms
- **Application Tracking** - Monitor the status of permit applications (pending, approved, rejected)
- **Edit & Delete** - Modify or remove pending applications
- **Profile Management** - Update personal information and change password

### For Administrators
- **Dashboard Analytics** - View statistics on users, permits, and payments
- **Permit Review** - Approve or reject permit applications with comments
- **User Management** - View all registered users
- **Comprehensive Oversight** - Monitor all permit applications across the system

### Supported Permit Types
1. **Building Permits** - Complete construction permit application with file uploads
2. **Business Permits** - Business registration and licensing
3. **Motorela Permits** - Vehicle operation permits

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with custom glass-morphism design
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL database + Authentication)
- **Routing**: React Router v7
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 16+ and npm
- A Supabase account and project

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Eboss-james-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   Run the SQL script in `database.sql` in your Supabase SQL editor to create all necessary tables and relationships.

5. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── DarkModeToggle.tsx
│   ├── Modal.tsx
│   ├── Navbar.tsx
│   ├── ProfileCard.tsx
│   ├── ProtectedRoute.tsx
│   └── Sidebar.tsx
├── pages/              # Page components
│   ├── AdminDashboard.tsx
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   └── Settings.tsx
├── services/           # API and business logic
│   ├── authService.ts
│   ├── permitService.ts
│   ├── profileService.ts
│   └── supabaseClient.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main app component with routing
├── main.tsx            # Application entry point
└── index.css           # Global styles and Tailwind config
```

## Database Schema

The application uses the following main tables:
- `profiles` - User information and authentication
- `permit_types` - Available permit categories
- `permits` - Main permit applications
- `motorela_permits` - Motorela-specific details
- `building_permit_*` - Building permit related tables
- `business_permit_*` - Business permit related tables
- `payments` - Payment tracking
- `permit_audits` - Audit trail for permit changes

## User Roles

- **citizen** - Regular users who can apply for permits
- **admin** - Administrators who can review and manage permits
- **staff** - Staff members (future implementation)

## Default Login Credentials

After setting up the database, you can create users through the registration page. The first admin user should be created manually in the database or through the registration form with role set to 'admin'.

## Features in Detail

### Authentication
- Username or email-based login
- Secure password hashing via Supabase Auth
- Protected routes based on user roles
- Session management

### Permit Application Flow
1. User selects permit type
2. Fills out permit-specific form fields
3. Uploads required documents (for building permits)
4. Submits application (status: pending)
5. Admin reviews and approves/rejects
6. User receives notification and can view admin comments

### File Uploads
Building permits support proof of ownership document uploads stored in Supabase Storage.

## Troubleshooting

### Environment Variables Not Loading
- Ensure your `.env` file is in the root directory
- Restart the development server after changing `.env`
- Variable names must start with `VITE_`

### Supabase Connection Issues
- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is active
- Ensure RLS (Row Level Security) policies are properly configured

### TypeScript Errors
Run `npm run typecheck` to identify type issues before building

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository.
