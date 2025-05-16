
-- Performance Optimizations for RxPrescribers Database
-- These optimizations will reduce resource usage and improve query performance

-- 1. Set appropriate work_mem for complex queries (adjust based on available memory)
ALTER SYSTEM SET work_mem = '32MB';  -- Increase if needed, but be cautious with concurrent connections

-- 2. Optimize shared_buffers for caching frequently accessed data
ALTER SYSTEM SET shared_buffers = '256MB';  -- Adjust based on total system memory

-- 3. Optimize vacuum and autovacuum settings to prevent bloat
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.05;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.025;

-- 4. Optimize drug name and generic name search with GIN indexes using trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram indexes for drug name searches
CREATE INDEX IF NOT EXISTS idx_npi_prescriptions_drug_name_trgm ON npi_prescriptions USING gin(drug_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_npi_prescriptions_generic_name_trgm ON npi_prescriptions USING gin(generic_name gin_trgm_ops);

-- 5. Create materialized view for popular medications to avoid repeated expensive aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_medications AS
SELECT drug_name, 
       COUNT(DISTINCT npi) as provider_count, 
       SUM(total_claim_count) as total_claims
FROM npi_prescriptions
GROUP BY drug_name
ORDER BY total_claims DESC
LIMIT 1000;

CREATE INDEX IF NOT EXISTS idx_popular_medications_name ON popular_medications(drug_name);

-- Create refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_popular_medications()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY popular_medications;
END;
$$ LANGUAGE plpgsql;

-- 6. Create search results cache table to avoid repeated expensive queries
CREATE TABLE IF NOT EXISTS search_cache (
    id SERIAL PRIMARY KEY,
    drug_query TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    radius_miles INTEGER NOT NULL,
    min_claims INTEGER NOT NULL DEFAULT 0,
    results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(drug_query, zip_code, radius_miles, min_claims)
);

CREATE INDEX IF NOT EXISTS idx_search_cache_lookup 
ON search_cache(drug_query, zip_code, radius_miles, min_claims);

CREATE INDEX IF NOT EXISTS idx_search_cache_expire ON search_cache(created_at);

-- Function to clean old cache entries
CREATE OR REPLACE FUNCTION clean_search_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM search_cache WHERE created_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- 7. Create procedure to search providers with caching
CREATE OR REPLACE PROCEDURE search_providers_cached(
    p_drug_name TEXT,
    p_zip_code TEXT,
    p_radius_miles INTEGER DEFAULT 10,
    p_min_claims INTEGER DEFAULT 0,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_cache_key TEXT;
    v_cache_exists BOOLEAN;
    v_results JSONB;
BEGIN
    -- Check if we have this search in cache
    SELECT EXISTS(
        SELECT 1 FROM search_cache 
        WHERE drug_query = p_drug_name 
        AND zip_code = p_zip_code
        AND radius_miles = p_radius_miles
        AND min_claims = p_min_claims
        AND created_at > NOW() - INTERVAL '1 day'
    ) INTO v_cache_exists;
    
    IF v_cache_exists THEN
        -- Use cached results - much faster and uses fewer resources
        UPDATE search_cache 
        SET created_at = NOW() 
        WHERE drug_query = p_drug_name 
        AND zip_code = p_zip_code
        AND radius_miles = p_radius_miles
        AND min_claims = p_min_claims;
    ELSE
        -- Perform search and cache results
        WITH search_results AS (
            SELECT 
                json_build_object(
                    'npi', nd.npi,
                    'name', CONCAT(nd.provider_first_name, ' ', nd.provider_last_name_legal_name),
                    'first_name', nd.provider_first_name,
                    'last_name', nd.provider_last_name_legal_name,
                    'specialty', nd.healthcare_provider_taxonomy_1_classification,
                    'city', na.provider_business_practice_location_address_city_name,
                    'state', na.provider_business_practice_location_address_state_name,
                    'postal_code', na.provider_business_practice_location_address_postal_code,
                    'distance_miles', ST_Distance(uz1.geom, uz2.geom)/1609.34,
                    'total_claims', np.total_claim_count
                ) AS provider_data
            FROM npi_details nd
            JOIN npi_addresses na ON nd.npi = na.npi
            JOIN npi_prescriptions np ON nd.npi = np.npi
            JOIN us_zipcodes uz1 ON na.provider_business_practice_location_address_postal_code = uz1.zip_code
            JOIN us_zipcodes uz2 ON uz2.zip_code = p_zip_code
            WHERE 
                (np.drug_name ILIKE '%' || p_drug_name || '%' OR np.generic_name ILIKE '%' || p_drug_name || '%')
                AND np.total_claim_count >= p_min_claims
                AND ST_Distance(uz1.geom, uz2.geom)/1609.34 <= p_radius_miles
            ORDER BY ST_Distance(uz1.geom, uz2.geom)/1609.34 ASC
        )
        SELECT json_agg(provider_data) INTO v_results FROM search_results;
        
        -- Cache the results
        INSERT INTO search_cache (drug_query, zip_code, radius_miles, min_claims, results)
        VALUES (p_drug_name, p_zip_code, p_radius_miles, p_min_claims, COALESCE(v_results, '[]'::jsonb))
        ON CONFLICT (drug_query, zip_code, radius_miles, min_claims) 
        DO UPDATE SET results = COALESCE(v_results, '[]'::jsonb), created_at = NOW();
    END IF;
END;
$$;

-- 8. Additional optimizations for common queries
CREATE INDEX IF NOT EXISTS idx_npi_details_npi ON npi_details(npi);
CREATE INDEX IF NOT EXISTS idx_npi_addresses_npi ON npi_addresses(npi);
CREATE INDEX IF NOT EXISTS idx_npi_prescriptions_npi_drug ON npi_prescriptions(npi, drug_name);
