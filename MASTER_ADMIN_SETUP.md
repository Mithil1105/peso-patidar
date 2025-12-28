# Master Admin System Setup Guide

## Overview
This guide explains how to set up and use the Master Admin system for managing all organizations, plans, and access control.

## Prerequisites
- Supabase project with admin access
- Service role key (for creating users programmatically)

## Step 1: Run Database Migrations

Run the following migrations in order:

1. **`20250201000000_create_master_admin_system.sql`**
   - Creates master admin tables and functions
   - Sets up subscription plans
   - Creates RLS policies
   - Adds payment/subscription fields

2. **`20250201000001_add_activity_tracking.sql`**
   - Adds triggers to track organization activity
   - Updates `last_activity_at` on expenses, transfers, etc.

## Step 2: Create Master Admin User

### Option A: Using Supabase Dashboard
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User"
3. Email: `mithil20056mistry@gmail.com`
4. Password: `qwertyui`
5. Click "Create User"

### Option B: Using SQL Script
Run the `create_master_admin_user.sql` script in Supabase SQL Editor.

### Option C: Using Supabase Admin API
```bash
curl -X POST 'https://your-project.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mithil20056mistry@gmail.com",
    "password": "qwertyui",
    "email_confirm": true
  }'
```

After creating the user, run:
```sql
UPDATE public.profiles 
SET is_master_admin = true, name = 'Master Admin'
WHERE email = 'mithil20056mistry@gmail.com';

INSERT INTO public.master_admin_memberships (user_id, is_active)
SELECT user_id, true FROM public.profiles WHERE email = 'mithil20056mistry@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET is_active = true;
```

## Step 3: Access Master Admin Panel

1. Login with master admin credentials
2. Navigate to `/master-admin` or click "Master Admin" in navigation (if added)
3. You should see the Master Admin Panel

## Features

### 1. Organization Management
- **View All Organizations**: See all organizations with Org ID, status, plan, user count
- **Create Organization**: Create new organization with admin user
- **Block/Unblock**: Block organizations if payment is pending
- **Change Plans**: Switch between Free Trial and Pro Plan

### 2. User Management
- **Create Organization Admin**: Only create admin users (not other roles)
- **View User Counts**: See user count per organization (no individual user data)

### 3. Storage Monitoring
- **Total Storage**: Database size + File storage
- **Breakdown**: See database and file storage separately
- **Refresh**: Manually refresh storage metrics

### 4. Announcements
- **Send Messages**: Send flash messages to organizations
- **Expiry Dates**: Set when announcements expire
- **Target**: Send to specific organization or all organizations

### 5. Activity Tracking
- **Last Activity**: See when each organization was last active
- **Auto-Update**: Activity tracked on expenses, transfers, etc.

## Usage

### Creating an Organization

1. Click "Create Organization"
2. Fill in:
   - Organization Name
   - Organization Slug (auto-generated from name)
   - Plan (Free Trial or Pro)
   - Admin Email (must exist in auth.users)
   - Admin Name
3. Click "Create"
4. Note the Org ID displayed

### Blocking an Organization

1. Find the organization in the table
2. Click the block icon (Ban icon)
3. Enter reason (optional)
4. Click "Block Organization"
5. Users will be logged out and cannot access

### Unblocking an Organization

1. Find the blocked organization
2. Click the unblock icon (Check icon)
3. Organization is immediately unblocked

### Sending Announcements

1. Click "Send Announcement"
2. Select target (All Organizations or specific org)
3. Enter message
4. Select type (Payment Reminder, Warning, Info, Urgent)
5. Select priority (High, Medium, Low)
6. Set expiry days (1-365)
7. Click "Send Announcement"

Announcements will appear on organization admin dashboards until expiry.

### Viewing Storage

1. Storage metrics are displayed automatically
2. Click "Refresh Storage" to update
3. See breakdown: Database Size, File Storage, Total

## Important Notes

1. **Master Admin Can Only Create Admin Users**: Organization admins create other users
2. **User Count Only**: Master admin sees user counts, not individual user data
3. **Activity Tracking**: Last activity excludes login (only real usage)
4. **Announcements Expire**: Set appropriate expiry dates
5. **Blocked Organizations**: Users are logged out when organization is blocked

## Troubleshooting

### Master Admin Cannot Access Panel
- Check `is_master_admin` flag in profiles table
- Verify user exists in `master_admin_memberships`
- Check RLS policies

### Cannot Create Organization
- Ensure admin user exists in `auth.users` first
- Check organization slug is unique
- Verify plan exists in `subscription_plans` table

### Storage Metrics Not Loading
- Check `get_storage_metrics` function permissions
- Verify master admin has access
- Check Supabase storage bucket permissions

### Announcements Not Showing
- Check expiry date hasn't passed
- Verify `is_active = true`
- Check organization_id matches (or is NULL for all orgs)

## Security

- Master admin bypasses organization RLS policies
- Master admin cannot see individual user data (only counts)
- Master admin can only create admin users
- All master admin functions use `SECURITY DEFINER` with checks

## Support

For issues or questions, check:
- Migration files for schema details
- RLS policies in migration files
- Function definitions in migration files

