# Master Migration Files

This folder contains the master migration files split into three parts for easier execution and troubleshooting.

## Files

1. **01_cleanup.sql** - Drops all existing database objects (tables, functions, triggers, policies, types, etc.)
2. **02_schema.sql** - Creates all database schema objects (types, tables, functions, triggers, sequences, indexes, RLS)
3. **03_policies.sql** - Creates all RLS policies, storage buckets, storage policies, grants, default data, and comments

## Usage

Run the files in order:

1. First, run `01_cleanup.sql` to clean up any existing objects
2. Then, run `02_schema.sql` to create all schema objects
3. Finally, run `03_policies.sql` to set up policies, storage, and default data

## Important Notes

- **Order matters**: Always run the files in numerical order (01 → 02 → 03)
- **Cleanup**: The cleanup file will delete ALL existing data and schema objects. Use with caution!
- **Dependencies**: The schema file creates tables in the correct dependency order (locations before profiles)
- **Realtime**: After migration, enable replication in Supabase Dashboard:
  - Go to Database > Replication
  - Enable replication for: `notifications`, `expenses`, `profiles`

## Troubleshooting

If you encounter errors:
- Make sure you're running the files in order
- Check that all previous files completed successfully
- The cleanup file handles missing objects gracefully with exception handling
- If a specific table/function already exists, the cleanup should remove it first

