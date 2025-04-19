-- Add a unique constraint to the company_name column
ALTER TABLE previously_considered ADD CONSTRAINT unique_company_name UNIQUE (company_name);

-- Create a stored procedure that bypasses RLS
CREATE OR REPLACE FUNCTION add_considered_company(company_name_param TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO previously_considered (company_name) 
  VALUES (company_name_param)
  ON CONFLICT (company_name) DO NOTHING;
END;
$$; 