# How to Fix the Supabase RLS Policy Issue

Your application is encountering Row-Level Security (RLS) policy violations when trying to insert records into the `previously_considered` table. Here are two ways to fix this issue:

## Option 1: Create an RPC Function (Recommended)

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Open the file `supabase_rpc_function.sql`
4. Run the SQL query to create the function
5. The application code already attempts to use this RPC function

## Option 2: Modify the RLS Policy

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Open the file `supabase_rls_policy.sql`
4. Choose one of the policy options and run that SQL

## Current Status

The application has been modified to:
1. Continue functioning even if database inserts fail
2. Maintain an in-memory list of considered companies
3. Return both database and in-memory records when queried

This ensures the application remains functional while you implement a permanent fix. 