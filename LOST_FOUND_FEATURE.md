# Lost & Found Management Feature

## Overview
The Lost & Found Management feature allows students to report lost items and browse found items within the BRACU SAM Portal. Students can post items with a title, description, and location without requiring images.

## Features

### Core Functionality
- **Report Lost Items**: Students can report items they've lost with title, description, and last seen location
- **Report Found Items**: Students can report items they've found with title, description, and found location
- **Browse Items**: View all lost, found, and claimed items in organized tabs
- **Search Functionality**: Search through items by title, description, or location
- **Status Management**: Items can be marked as lost, found, or claimed
- **User Management**: Users can only edit/delete their own items

### User Interface
- **Tabbed Interface**: Separate tabs for Lost, Found, and Claimed items
- **Statistics Dashboard**: Shows counts of items by status and user's own items
- **Responsive Design**: Works on desktop and mobile devices
- **Modal Form**: Clean form interface for reporting items
- **Real-time Updates**: Items update immediately after creation/modification

## Database Schema

### Table: `lost_found_items`
```sql
CREATE TABLE IF NOT EXISTS public.lost_found_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES public.manual_users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'lost' CHECK (status IN ('lost', 'found', 'claimed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Fields
- `id`: Unique identifier for each item
- `title`: Brief title of the lost/found item
- `description`: Detailed description of the item
- `location`: Where the item was lost or found
- `user_id`: Reference to the user who reported the item
- `status`: Current status (lost, found, claimed)
- `created_at`: When the item was first reported
- `updated_at`: When the item was last updated

## Implementation Details

### Files Created/Modified

#### New Files
1. **`create_lost_found_table.sql`** - Database table creation script
2. **`src/hooks/useLostFound.ts`** - Custom hook for CRUD operations
3. **`src/pages/LostFound.tsx`** - Main Lost & Found page
4. **`src/components/LostFoundForm.tsx`** - Form component for reporting items

#### Modified Files
1. **`src/App.tsx`** - Added route for `/lost-found`
2. **`src/components/Header.tsx`** - Added navigation item

### Key Components

#### useLostFound Hook
- `fetchItems()`: Get all lost and found items
- `createItem()`: Create a new item
- `updateItemStatus()`: Update item status
- `deleteItem()`: Delete an item
- `getItemsByStatus()`: Filter items by status
- `getUserItems()`: Get current user's items

#### LostFound Page
- Tabbed interface for different item statuses
- Search functionality
- Statistics dashboard
- Item cards with action buttons
- Modal form integration

#### LostFoundForm Component
- Dual tabs for lost/found items
- Form validation
- Error handling
- Responsive design

## Security Features

### Row Level Security (RLS)
- Users can view all items
- Users can only create items for themselves
- Users can only update/delete their own items

### Authentication
- Protected route requiring user authentication
- User context integration for ownership checks

## Usage Instructions

### For Students
1. Navigate to "Lost & Found" in the main navigation
2. Click "Report Item" to create a new entry
3. Choose between "Lost Item" or "Found Item" tab
4. Fill in the title, description, and location
5. Submit the form
6. Browse existing items using the tabs and search
7. Mark your own items as "Claimed" when retrieved

### For Administrators
- Can view all items
- Can monitor item statistics
- Can help manage the lost and found system

## Future Enhancements
- Email notifications for matching items
- Image upload support
- Category filtering
- Advanced search with filters
- Admin dashboard for managing items
- Integration with campus security office

## Technical Notes
- Uses Supabase for database operations
- Implements React hooks for state management
- Follows existing project patterns and styling
- Responsive design with Tailwind CSS
- TypeScript for type safety
