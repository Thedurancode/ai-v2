# How to Fix Database Issues

This guide will help you fix two issues with your application:

1. Searches not being saved to the database
2. NaN scores for potential partners

## Issue 1: Searches Not Being Saved to Database

The issue is with the Row Level Security (RLS) policy on the `search_history` table in your Supabase database.

### Step 1: Fix RLS Policies

Follow the instructions in `supabase_rls_instructions.md` to fix the RLS policies for the `search_history` table.

### Step 2: Verify the Fix

Run the verification script to check if searches are now being saved:

```bash
python3 verify_search_history.py
```

If the script shows "Search history verification completed successfully!", the issue is fixed.

### Step 3: Test in the Application

1. Start your application
2. Perform a search
3. Check if the search appears in the search history

## Issue 2: NaN Scores for Potential Partners

Some potential partners have "NaN" (Not a Number) scores, which can cause display issues in the UI.

### Step 1: Fix NaN Scores

Run the script to fix NaN scores:

```bash
python3 fix_nan_scores.py
```

This script will:
1. Find all partners with NaN scores
2. Update their scores to 0
3. Show a summary of the updates

### Step 2: Verify the Fix

After running the script, check if all NaN scores have been fixed:

```bash
python3 fix_nan_scores.py
```

If the script shows "No partners with NaN scores found. Nothing to fix.", the issue is fixed.

### Step 3: Test in the Application

1. Start your application
2. Navigate to the potential partners page
3. Verify that all partners have numeric scores (no "NaN" values)

## Additional Information

### Modified Files

The following files have been modified or created to fix these issues:

1. `database.py` - Updated the `add_search_to_history` function to handle RLS issues
2. `supabase_rls_instructions.md` - Instructions for fixing RLS policies
3. `verify_search_history.py` - Script to verify search history functionality
4. `fix_nan_scores.py` - Script to fix NaN scores
5. `test_search_history.py` - Script to test search history functionality

### Troubleshooting

If you're still experiencing issues:

1. Check the Supabase dashboard for any errors
2. Verify that your `.env` file has the correct Supabase URL and key
3. Check the application logs for any error messages
4. Run the verification scripts again to see if the issues persist

### Contact

If you need further assistance, please contact the development team.
