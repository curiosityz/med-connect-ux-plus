
-- PostgreSQL index optimizations for medication and provider searches

-- Indexes for npi_prescriptions table to optimize drug searches
CREATE INDEX IF NOT EXISTS idx_npi_prescriptions_drug_name_trgm ON npi_prescriptions USING gin(drug_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_npi_prescriptions_generic_name_trgm ON npi_prescriptions USING gin(generic_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_npi_prescriptions_npi ON npi_prescriptions(npi);
CREATE INDEX IF NOT EXISTS idx_npi_prescriptions_claim_count ON npi_prescriptions(total_claim_count DESC);

-- Popular medications materialized view for fast access to common medications
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_medications AS
SELECT drug_name, COUNT(DISTINCT npi) as provider_count, SUM(total_claim_count) as total_claims
FROM npi_prescriptions
GROUP BY drug_name
ORDER BY total_claims DESC
LIMIT 1000;

CREATE INDEX IF NOT EXISTS idx_popular_medications_name ON popular_medications(drug_name);

-- Create a function to refresh the popular medications view
CREATE OR REPLACE FUNCTION refresh_popular_medications()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY popular_medications;
END;
$$ LANGUAGE plpgsql;

-- Optimize full provider details queries
CREATE INDEX IF NOT EXISTS idx_npi_details_full_name ON npi_details((provider_first_name || ' ' || provider_last_name_legal_name));

-- Improve taxonomy lookups
CREATE INDEX IF NOT EXISTS idx_npi_details_taxonomy_class_trgm 
ON npi_details USING gin(healthcare_provider_taxonomy_1_classification gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_npi_details_taxonomy_spec_trgm 
ON npi_details USING gin(healthcare_provider_taxonomy_1_specialization gin_trgm_ops);

-- Geographic query optimizations
CREATE INDEX IF NOT EXISTS idx_us_zipcodes_geom ON us_zipcodes USING gist(geom);
CREATE INDEX IF NOT EXISTS idx_npi_addresses_postal_code ON npi_addresses(provider_business_practice_location_address_postal_code);

-- Optimize postal code lookups across tables
CREATE INDEX IF NOT EXISTS idx_npi_addresses_state_city_postal 
ON npi_addresses(provider_business_practice_location_address_state_name, provider_business_practice_location_address_city_name, provider_business_practice_location_address_postal_code);

-- Create a cache table for commonly searched drug+location combinations
CREATE TABLE IF NOT EXISTS search_cache (
    id SERIAL PRIMARY KEY,
    drug_name TEXT NOT NULL,
    location_zip TEXT NOT NULL,
    radius_miles INTEGER NOT NULL,
    min_claims INTEGER NOT NULL DEFAULT 0,
    results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(drug_name, location_zip, radius_miles, min_claims)
);

CREATE INDEX IF NOT EXISTS idx_search_cache_lookup 
ON search_cache(drug_name, location_zip, radius_miles, min_claims);

CREATE INDEX IF NOT EXISTS idx_search_cache_expire ON search_cache(created_at);

-- Add a function to clean old cache entries
CREATE OR REPLACE FUNCTION clean_old_search_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM search_cache WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create a function to get cached results or perform new search
CREATE OR REPLACE FUNCTION get_providers_by_drug(
    p_drug_name TEXT,
    p_zip_code TEXT,
    p_radius_miles INTEGER DEFAULT 10,
    p_min_claims INTEGER DEFAULT 0,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    npi TEXT,
    provider_name TEXT,
    provider_first_name TEXT,
    provider_last_name TEXT,
    taxonomy TEXT,
    specialty TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    distance_miles NUMERIC,
    claim_count INTEGER
) AS $$
DECLARE
    cache_hit BOOLEAN;
    cache_results JSONB;
BEGIN
    -- Check cache first
    SELECT EXISTS(
        SELECT 1 FROM search_cache 
        WHERE drug_name = p_drug_name 
        AND location_zip = p_zip_code
        AND radius_miles = p_radius_miles
        AND min_claims = p_min_claims
        AND created_at > NOW() - INTERVAL '24 hours'
    ) INTO cache_hit;
    
    IF cache_hit THEN
        -- Use cached results
        SELECT results INTO cache_results FROM search_cache 
        WHERE drug_name = p_drug_name 
        AND location_zip = p_zip_code
        AND radius_miles = p_radius_miles
        AND min_claims = p_min_claims
        LIMIT 1;
        
        -- Return results from cache
        RETURN QUERY 
        SELECT 
            (r->>'npi')::TEXT,
            (r->>'provider_name')::TEXT,
            (r->>'provider_first_name')::TEXT,
            (r->>'provider_last_name')::TEXT,
            (r->>'taxonomy')::TEXT,
            (r->>'specialty')::TEXT,
            (r->>'city')::TEXT,
            (r->>'state')::TEXT,
            (r->>'postal_code')::TEXT,
            (r->>'distance_miles')::NUMERIC,
            (r->>'claim_count')::INTEGER
        FROM jsonb_array_elements(cache_results) r
        LIMIT p_limit OFFSET p_offset;
    ELSE
        -- Perform new search and store in cache
        -- This implementation depends on your specific table structure
        RETURN QUERY 
        WITH search_results AS (
            SELECT 
                nd.npi,
                CONCAT(nd.provider_first_name, ' ', nd.provider_last_name_legal_name) AS provider_name,
                nd.provider_first_name,
                nd.provider_last_name_legal_name AS provider_last_name,
                nd.healthcare_provider_taxonomy_1_classification AS taxonomy,
                nd.healthcare_provider_taxonomy_1_specialization AS specialty,
                na.provider_business_practice_location_address_city_name AS city,
                na.provider_business_practice_location_address_state_name AS state,
                na.provider_business_practice_location_address_postal_code AS postal_code,
                ST_Distance(uz1.geom, uz2.geom)/1609.34 AS distance_miles,
                np.total_claim_count AS claim_count
            FROM npi_prescriptions np
            JOIN npi_details nd ON np.npi = nd.npi
            JOIN npi_addresses na ON nd.npi = na.npi
            JOIN us_zipcodes uz1 ON na.provider_business_practice_location_address_postal_code = uz1.zip_code
            JOIN us_zipcodes uz2 ON uz2.zip_code = p_zip_code
            WHERE 
                (np.drug_name ILIKE '%' || p_drug_name || '%' OR np.generic_name ILIKE '%' || p_drug_name || '%')
                AND np.total_claim_count >= p_min_claims
                AND ST_Distance(uz1.geom, uz2.geom)/1609.34 <= p_radius_miles
            ORDER BY distance_miles ASC
        )
        SELECT * FROM search_results
        LIMIT p_limit OFFSET p_offset;
        
        -- Cache the results (all results, not just the current page)
        INSERT INTO search_cache (drug_name, location_zip, radius_miles, min_claims, results)
        SELECT 
            p_drug_name, 
            p_zip_code, 
            p_radius_miles, 
            p_min_claims,
            jsonb_agg(
                jsonb_build_object(
                    'npi', npi,
                    'provider_name', provider_name,
                    'provider_first_name', provider_first_name,
                    'provider_last_name', provider_last_name,
                    'taxonomy', taxonomy,
                    'specialty', specialty,
                    'city', city,
                    'state', state,
                    'postal_code', postal_code,
                    'distance_miles', distance_miles,
                    'claim_count', claim_count
                )
            )
        FROM search_results
        ON CONFLICT (drug_name, location_zip, radius_miles, min_claims) 
        DO UPDATE SET results = EXCLUDED.results, created_at = NOW();
    END IF;
END;
$$ LANGUAGE plpgsql;
