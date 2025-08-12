# BRAC University Portal

A comprehensive student activity management system built specifically for BRAC University, featuring real-time event management, club discovery, forums, and academic resources with Supabase PostgreSQL backend.

## 🎓 About

This portal serves as the central hub for BRAC University students, staff, and administrators to:
- Discover and join student clubs
- Manage and participate in campus events  
- Access academic resources
- Engage in community discussions
- Connect with fellow students

## ✨ Features

### 🏛️ **Multi-Role System**
- **Students**: Browse events, join clubs, access resources
- **Faculty/Staff**: Create and manage events, competitions, and programs
- **Administrators**: Full system management capabilities

### 📅 **Event Management** 
- Faculty can create, schedule, edit, and delete campus events
- Event categories: Workshops, Competitions, Cultural, Academic, Sports, Social
- Real-time attendee tracking and registration
- Email notifications for event updates

### 🎪 **Club Discovery**
- Browse student organizations with real database
- Filter by categories and interests
- Join clubs and track membership
- Real-time membership updates

### 💬 **Community Features**
- Discussion forums by category
- Academic help and study groups
- Campus life discussions
- Real-time messaging system

### 📚 **Academic Resources**
- File storage and sharing
- Course materials and guides
- Career opportunities
- Educational resources by department

## 🚀 Technology Stack

- **Frontend**: React 18 + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **State Management**: React Context API + Custom Hooks
- **Authentication**: Supabase Auth with email verification
- **Database**: PostgreSQL with Row Level Security (RLS)

## 🛠️ Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd uni-activity-sphere
npm install
```

### 2. Database Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Execute the SQL schema from `DATABASE_SETUP.md`
3. Get your project URL and anon key

### 3. Environment Configuration
Create a `.env` file:
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Start Development Server
```bash
npm run dev
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components (shadcn/ui)
│   ├── EventManagement.tsx # Faculty event management
│   ├── Header.tsx          # Navigation header
│   ├── Footer.tsx          # Site footer
│   ├── Layout.tsx          # Main layout wrapper
│   └── LoadingSpinner.tsx  # Loading component
├── pages/
│   ├── Index.tsx           # Homepage
│   ├── Events.tsx          # Events listing & management
│   ├── Clubs.tsx           # Club discovery
│   ├── Forum.tsx           # Discussion forums
│   ├── SignIn.tsx          # Authentication
│   ├── SignUp.tsx          # User registration
│   └── AdminDashboard.tsx  # Admin panel
├── context/
│   └── AuthContext.tsx     # Supabase authentication state
├── hooks/
│   ├── useDatabase.ts      # Database operation hooks
│   └── use-toast.ts        # Toast notifications
└── lib/
    └── supabase.ts         # Supabase client configuration
```

## 🔐 Authentication & Roles

### Registration Process
1. Users register with BRACU email addresses
2. Email verification required
3. Role assignment:
   - **Student**: Default role for students
   - **Faculty**: University staff with event management
   - **Admin**: Full system administration

### Role Permissions
- **Students**: View events, join clubs, participate in forums
- **Faculty**: All student permissions + event management
- **Admin**: All permissions + user management, system settings

## 🎯 Key Features Implemented

### Real Database Integration
- ✅ Supabase PostgreSQL backend
- ✅ Row Level Security (RLS) policies
- ✅ Real-time subscriptions
- ✅ File storage for avatars and resources

### Event Management System
- ✅ Complete CRUD operations for events
- ✅ Faculty-only event creation and management
- ✅ Real-time event updates
- ✅ Event registration system

### Security Features
- ✅ Email verification required
- ✅ Role-based access control
- ✅ Secure API endpoints
- ✅ Input validation and sanitization

### User Experience
- ✅ Responsive design (mobile-first)
- ✅ Loading states and error handling
- ✅ Toast notifications
- ✅ Modern UI with animations

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📊 Database Schema

The project uses a comprehensive PostgreSQL schema with:
- User profiles and role management
- Club and membership system
- Event and registration tracking
- Forum threads and posts
- Real-time messaging
- File storage metadata

See `DATABASE_SETUP.md` for complete schema details.

## 🚀 Deployment

1. **Build the project**: `npm run build`
2. **Deploy to hosting platform** (Vercel, Netlify, etc.)
3. **Set environment variables** in your hosting platform
4. **Configure Supabase** for production use

## 🛡️ Security

- All API routes protected with Row Level Security
- Email verification required for all accounts
- Role-based permissions enforced at database level
- Input validation on all forms
- Secure file upload handling

## 📧 Contact

Built for BRAC University
- **Address**: 66 Mohakhali, Dhaka 1212, Bangladesh
- **Phone**: +880 2 9844051-4
- **Email**: info@bracu.ac.bd

## 📄 License

This project is built for educational purposes for BRAC University.

---

**Note**: This is a production-ready application with real authentication and database integration. Ensure proper security measures are in place before deploying to production.