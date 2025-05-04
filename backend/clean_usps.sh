
#!/bin/bash



# --- Configuration ---

DB_HOST="localhost" # Or your server IP

DB_PORT="5432"

DB_NAME="rx"

DB_USER="gh0st"

# Ensure ~/.pgpass is configured with: localhost:5432:rx:gh0st:YOUR_PASSWORD

# Or uncomment and set the line below (LESS SECURE)

# export PGPASSWORD="YOUR_PASSWORD"



USPS_KEY="sAgAmJIgzmCCPvR3T8PJkyuOQKVEANtG6Op7ymcHFmJA6rCZ"

USPS_SECRET="RtO0nbG4KWBgn2lltN1Pg6NG2PxxGPFRSGXghIMS2TVymQVa0rsZa5EmeAvnx4Kd"

USPS_API_BASE="https://api.usps.com" # CHECK THIS URL

USPS_TOKEN_PATH="/oauth2/v3/token"    # CHECK THIS PATH

USPS_VERIFY_PATH="/addresses/v3/address" # CHECK THIS PATH

SLEEP_INTERVAL=0.1 # Delay between API calls



# --- Function to get Token ---

USPS_ACCESS_TOKEN=""

TOKEN_EXPIRES_AT=0

function get_usps_token {

    local now=$(date +%s)

    if [[ "$USPS_ACCESS_TOKEN" != "" && $TOKEN_EXPIRES_AT -gt $((now + 60)) ]]; then

        # echo "Using cached token." # Reduce noise

        return 0

    fi

    echo "Requesting new USPS token..."

    local encoded_creds=$(echo -n "${USPS_KEY}:${USPS_SECRET}" | base64)

    # Single line curl:

    local token_response=$(curl -s -X POST "${USPS_API_BASE}${USPS_TOKEN_PATH}" -H "Authorization: Basic ${encoded_creds}" -H "Content-Type: application/x-www-form-urlencoded" --data-urlencode "grant_type=client_credentials")

    if [[ $? -ne 0 ]]; then echo "ERROR: curl command failed for token request."; return 1; fi

    USPS_ACCESS_TOKEN=$(echo "$token_response" | jq -r '.access_token // empty')

    local expires_in=$(echo "$token_response" | jq -r '.expires_in // 3599')

    if [[ "$USPS_ACCESS_TOKEN" == "" || "$USPS_ACCESS_TOKEN" == "null" ]]; then echo "ERROR: Failed to get access_token from response:"; echo "$token_response"; USPS_ACCESS_TOKEN=""; return 1; fi

    TOKEN_EXPIRES_AT=$((now + expires_in))

    echo "Obtained new USPS token."

    return 0

}



# --- Main Processing ---

if ! command -v jq &> /dev/null; then echo "ERROR: 'jq' command not found. Please install it (e.g., 'apt install jq')."; exit 1; fi

if ! command -v base64 &> /dev/null; then echo "ERROR: 'base64' command not found. Please install it (e.g., 'apt install coreutils')."; exit 1; fi



if [ -z "$PGPASSWORD" ] && [ ! -f "$HOME/.pgpass" ]; then

   echo "Warning: PGPASSWORD environment variable not set and ~/.pgpass file not found."

   echo "Ensure ~/.pgpass has localhost:5432:rx:gh0st:YOUR_PASSWORD and chmod 600."

   # Consider adding 'exit 1' here if password handling is mandatory

fi



PSQL_CMD="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -qtAX"

FETCH_COUNT=100



total_rows=$($PSQL_CMD -c "SELECT count(*) FROM npi_addresses WHERE provider_first_line_business_practice_location_address IS NOT NULL AND provider_first_line_business_practice_location_address != '' AND ( (provider_business_practice_location_address_city_name IS NOT NULL AND provider_business_practice_location_address_city_name != '' AND provider_business_practice_location_address_state_name IS NOT NULL AND provider_business_practice_location_address_state_name != '') OR (left(provider_business_practice_location_address_postal_code, 5) IS NOT NULL AND left(provider_business_practice_location_address_postal_code, 5) != '' AND left(provider_business_practice_location_address_postal_code, 5) ~ '^[0-9]{5}$') );")

# Check if count query succeeded

if ! [[ "$total_rows" =~ ^[0-9]+$ ]] ; then

   echo "ERROR: Failed to get row count from database. Check connection/credentials."

   exit 1

fi

echo "Estimated total addresses to process: $total_rows"

if [[ "$total_rows" -eq 0 ]]; then

  echo "No addresses match the criteria for processing."

  exit 0

fi





echo "Starting address processing..."

total_processed=0

total_success=0

total_fail=0

offset=0



while true; do # Outer loop to handle potential token expiry during batch processing

    get_usps_token || { echo "ERROR: Failed to obtain initial/refresh token. Stopping."; break; }



    rows_in_batch_processed=0 # Counter for rows processed *with the current token*



    while [[ $offset -lt $total_rows ]]; do

        # Refresh token if getting close to expiry, before fetching next DB batch

        local now=$(date +%s)

        if ! [[ "$USPS_ACCESS_TOKEN" != "" && $TOKEN_EXPIRES_AT -gt $((now + 120)) ]]; then # Check if expires in next 2 mins

           echo "Token nearing expiry, attempting refresh..."

           get_usps_token || { echo "ERROR: Failed to refresh token mid-batch. Stopping."; break 2; } # break outer loop

        fi



        echo -ne "Processing offset $offset / $total_rows ... \r"



        # Fetch batch (added error handling)

        batch_fetch_command="$PSQL_CMD --field-separator='|' -c \"SELECT npi, COALESCE(provider_first_line_business_practice_location_address, ''), COALESCE(provider_second_line_business_practice_location_address, ''), COALESCE(provider_business_practice_location_address_city_name, ''), COALESCE(provider_business_practice_location_address_state_name, ''), COALESCE(left(provider_business_practice_location_address_postal_code, 5), '') FROM npi_addresses WHERE provider_first_line_business_practice_location_address IS NOT NULL AND provider_first_line_business_practice_location_address != '' AND ( (provider_business_practice_location_address_city_name IS NOT NULL AND provider_business_practice_location_address_city_name != '' AND provider_business_practice_location_address_state_name IS NOT NULL AND provider_business_practice_location_address_state_name != '') OR (left(provider_business_practice_location_address_postal_code, 5) IS NOT NULL AND left(provider_business_practice_location_address_postal_code, 5) != '' AND left(provider_business_practice_location_address_postal_code, 5) ~ '^[0-9]{5}$') ) ORDER BY npi LIMIT $FETCH_COUNT OFFSET $offset;\""

        mapfile -t batch_rows < <(eval $batch_fetch_command) # Use eval to handle nested quotes

        psql_exit_code=$?



        if [[ $psql_exit_code -ne 0 ]]; then

            echo -e "\nERROR: psql failed fetching batch at offset $offset. Stopping."

            break 2 # break outer loop

        fi



        if [[ ${#batch_rows[@]} -eq 0 ]]; then

             # This might happen if total_rows changes or on the very last fetch

             echo -e "\nNo more addresses returned by fetch at offset $offset."

             offset=$total_rows # Ensure loop condition breaks

             continue # Skip rest of inner loop, outer loop condition will exit

        fi



        rows_in_batch=${#batch_rows[@]}

        echo -ne "Processing offset $offset / $total_rows (Fetched $rows_in_batch) ... \r"



        for row_data in "${batch_rows[@]}"; do

            IFS='|' read -r npi street secondary city state zipcode <<< "$row_data"



            if [[ -z "$street" || -z "$state" || (-z "$city" && -z "$zipcode") ]]; then continue; fi



            # Build JSON (**VERIFY FIELD NAMES WITH USPS DOCS**)

            json_payload=$(jq -nc --arg street "$street" --arg secondary "$secondary" --arg city "$city" --arg state "$state" --arg zipcode "$zipcode" '{ "streetAddress": $street, "secondaryAddress": $secondary, "city": $city, "state": $state, "zipCode": $zipcode }' | jq 'del(if .secondaryAddress == "" then .secondaryAddress else empty end | if .city == "" then .city else empty end | if .zipCode == "" then .zipCode else empty end)')



            # Call USPS API (**VERIFY FIELD NAMES WITH USPS DOCS**)

            usps_response=$(curl -s -X POST "${USPS_API_BASE}${USPS_VERIFY_PATH}" -H "Authorization: Bearer ${USPS_ACCESS_TOKEN}" -H "Content-Type: application/json" -H "Accept: application/json" --data "$json_payload")

            curl_exit_code=$?

            if [[ $curl_exit_code -ne 0 ]]; then echo -e "\nERROR: curl API call failed ($curl_exit_code) for NPI $npi."; total_fail=$((total_fail + 1)); continue; fi



            # Parse response (**VERIFY FIELD NAMES WITH USPS DOCS**)

            firm=$(echo "$usps_response" | jq -r '.address.firmName // empty'); std_street=$(echo "$usps_response" | jq -r '.address.streetAddress // empty'); std_secondary=$(echo "$usps_response" | jq -r '.address.secondaryAddress // empty'); std_city=$(echo "$usps_response" | jq -r '.address.city // empty'); std_state=$(echo "$usps_response" | jq -r '.address.stateAbbreviation // empty'); std_zip5=$(echo "$usps_response" | jq -r '.address.zip5 // empty'); std_zip4=$(echo "$usps_response" | jq -r '.address.zip4 // empty'); std_urbanization=$(echo "$usps_response" | jq -r '.address.urbanization // empty'); return_text=$(echo "$usps_response" | jq -r '.returnText // .error.message // .error.description // (.error | tostring) // .errorDetails // tostring'); error_number=$(echo "$usps_response" | jq -r '.errorNumber // .error.number // empty');



            # Basic Check

            if [[ -z "$std_street" && -n "$return_text" && "$return_text" != "null" ]]; then total_fail=$((total_fail + 1)); else total_success=$((total_success + 1)); fi



            # Prepare & Execute SQL UPSERT

            sql_upsert=$(cat <<INNEREOF

INSERT INTO npi_addresses_usps (npi, usps_firm, usps_street_address, usps_secondary_address, usps_city, usps_state_abbr, usps_zip5, usps_zip4, usps_urbanization, usps_return_text, usps_error_number, usps_processed_at) VALUES ($npi, $(printf %q "$firm"), $(printf %q "$std_street"), $(printf %q "$std_secondary"), $(printf %q "$std_city"), $(printf %q "$std_state"), $(printf %q "$std_zip5"), $(printf %q "$std_zip4"), $(printf %q "$std_urbanization"), $(printf %q "$return_text"), $(printf %q "$error_number"), NOW())

ON CONFLICT (npi) DO UPDATE SET usps_firm = EXCLUDED.usps_firm, usps_street_address = EXCLUDED.usps_street_address, usps_secondary_address = EXCLUDED.usps_secondary_address, usps_city = EXCLUDED.usps_city, usps_state_abbr = EXCLUDED.usps_state_abbr, usps_zip5 = EXCLUDED.usps_zip5, usps_zip4 = EXCLUDED.usps_zip4, usps_urbanization = EXCLUDED.usps_urbanization, usps_return_text = EXCLUDED.usps_return_text, usps_error_number = EXCLUDED.usps_error_number, usps_processed_at = EXCLUDED.usps_processed_at;

INNEREOF

)

            $PSQL_CMD -c "$sql_upsert" > /dev/null 2>&1

            if [[ $? -ne 0 ]]; then echo -e "\nERROR: Database update failed for NPI $npi"; fi



            total_processed=$((total_processed + 1))

            rows_in_batch_processed=$((rows_in_batch_processed + 1))

            sleep "$SLEEP_INTERVAL"

        done # End loop through rows in batch



        # Increment offset ONLY if we successfully fetched rows in this iteration

        if [[ $rows_in_batch -gt 0 ]]; then

             offset=$(( offset + rows_in_batch ))

        else

            # If fetch returned 0 rows even though offset < total_rows, break to prevent infinite loop

            echo -e "\nWarning: Fetched 0 rows unexpectedly. Finishing processing."

            offset=$total_rows

        fi





    done # End inner while [[ $offset -lt $total_rows ]]

    # Outer loop will reiterate if token needed refresh and inner loop broke



    # If we exited the inner loop normally (offset >= total_rows), break outer loop too

    if [[ $offset -ge $total_rows ]]; then

        break

    fi



done # End outer while true





echo -e "\n--- Processing Complete ---"

echo "Total Records Processed Attempts: $total_processed"

echo "Successful Standardizations (approx): $total_success"

echo "Failed Standardizations/Errors: $total_fail"



unset PGPASSWORD

