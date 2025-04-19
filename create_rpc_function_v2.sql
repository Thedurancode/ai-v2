-- Create an RPC function to insert a potential partner
-- This function bypasses the HTTP extension issue by using direct SQL

CREATE OR REPLACE FUNCTION insert_potential_partner(
    p_name TEXT,
    p_score FLOAT,
    p_industry TEXT,
    p_description TEXT
) RETURNS JSONB AS $$
DECLARE
    inserted_id UUID;
    result JSONB;
BEGIN
    -- Insert the record and return the ID
    INSERT INTO potential_partners (name, score, industry, description)
    VALUES (p_name, p_score, p_industry, p_description)
    RETURNING id INTO inserted_id;
    
    -- Create a JSON result
    result := jsonb_build_object(
        'id', inserted_id,
        'name', p_name,
        'success', TRUE
    );
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    -- Return error information
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
