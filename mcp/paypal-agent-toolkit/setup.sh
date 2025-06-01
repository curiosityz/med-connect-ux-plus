#!/bin/bash

echo "PayPal Agent Toolkit MCP Server Setup"
echo "===================================="
echo ""
echo "This script will help you set up the PayPal Agent Toolkit MCP server."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js (version 18+) from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js version 18+ is required. Current version: $(node -v)"
    echo "Please upgrade Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version $(node -v) detected. ✓"
echo ""

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed. Please install curl to generate a PayPal access token."
    exit 1
fi

echo "curl is installed. ✓"
echo ""

# Check for existing .env file
ENV_FILE="$(pwd)/.env"
if [ -f "$ENV_FILE" ]; then
    echo "Found existing .env file."
    
    # Check if it contains PayPal credentials
    if grep -q "NEXT_PUBLIC_PAYPAL_CLIENT_ID" "$ENV_FILE" && grep -q "PAYPAL_SECRET" "$ENV_FILE"; then
        echo "Found existing PayPal credentials in .env file."
        
        # Extract credentials
        CLIENT_ID=$(grep "NEXT_PUBLIC_PAYPAL_CLIENT_ID" "$ENV_FILE" | cut -d '=' -f 2)
        CLIENT_SECRET=$(grep "PAYPAL_SECRET" "$ENV_FILE" | cut -d '=' -f 2)
        
        echo "Generating PayPal access token using existing credentials..."
        
        # Generate access token using production endpoint
        TOKEN_RESPONSE=$(curl -s -X POST https://api-m.paypal.com/v1/oauth2/token \
            -H "Accept: application/json" \
            -H "Accept-Language: en_US" \
            -u "$CLIENT_ID:$CLIENT_SECRET" \
            -d "grant_type=client_credentials")
        
        # Extract access token
        ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d '"' -f 4)
        
        if [ -n "$ACCESS_TOKEN" ]; then
            echo "Access token generated successfully. ✓"
            
            # Check if PAYPAL_ACCESS_TOKEN already exists in .env
            if grep -q "PAYPAL_ACCESS_TOKEN" "$ENV_FILE"; then
                # Update existing PAYPAL_ACCESS_TOKEN
                sed -i "s|PAYPAL_ACCESS_TOKEN=.*|PAYPAL_ACCESS_TOKEN=$ACCESS_TOKEN|" "$ENV_FILE"
            else
                # Add PAYPAL_ACCESS_TOKEN to .env
                echo "" >> "$ENV_FILE"
                echo "# MCP Server Configuration" >> "$ENV_FILE"
                echo "PAYPAL_ACCESS_TOKEN=$ACCESS_TOKEN" >> "$ENV_FILE"
                echo "PAYPAL_ENVIRONMENT=SANDBOX" >> "$ENV_FILE"
            fi
            
            echo "Access token added to .env file. ✓"
        else
            echo "Failed to generate access token. Please check your credentials."
            echo "Error response: $TOKEN_RESPONSE"
            echo ""
            echo "You will need to manually generate an access token and add it to the .env file."
        fi
    else
        echo "No PayPal credentials found in .env file."
        echo ""
        echo "To generate a PayPal access token, follow these steps:"
        echo ""
        echo "1. Using cURL (for Production environment):"
        echo "   curl -v https://api-m.paypal.com/v1/oauth2/token \\"
        echo "     -H \"Accept: application/json\" \\"
        echo "     -H \"Accept-Language: en_US\" \\"
        echo "     -u \"YOUR_CLIENT_ID:YOUR_CLIENT_SECRET\" \\"
        echo "     -d \"grant_type=client_credentials\""
        echo ""
        echo "2. Using Postman:"
        echo "   - Create a POST request to https://api-m.paypal.com/v1/oauth2/token"
        echo "   - Set method to POST"
        echo "   - Under Authorization, select Basic Auth and enter your Client ID and Client Secret"
        echo "   - Under Body, select x-www-form-urlencoded and add a key grant_type with value client_credentials"
        echo "   - Send the request"
        echo ""
        echo "3. From the response, copy the access_token value:"
        echo "   {\"scope\":\"...\",\"access_token\":\"Your Access Token\",\"token_type\":\"Bearer\",\"app_id\":\"APP-80W284485P519543T\",\"expires_in\":32400,\"nonce\":\"...\"}"
        echo ""
        echo "4. Add the access token to your .env file:"
        echo "   PAYPAL_ACCESS_TOKEN=your_access_token_here"
        echo ""
        echo "Note: Production tokens are valid for 8 hours. You'll need to refresh the token periodically."
    fi
else
    echo "No .env file found. Creating a new one..."
    
    cat > "$ENV_FILE" << EOL
# PayPal Agent Toolkit MCP Server Environment Variables
# Replace the placeholder values with your actual credentials

# Your PayPal Access Token (required)
PAYPAL_ACCESS_TOKEN=

# Environment: SANDBOX or PRODUCTION (default: SANDBOX)
PAYPAL_ENVIRONMENT=SANDBOX
EOL

    echo ".env file created. ✓"
    echo ""
    echo "To complete the setup, you need to generate a PayPal access token:"
    echo ""
    echo "1. Create a PayPal Developer account at https://developer.paypal.com/dashboard/"
    echo "2. Create an app to get your Client ID and Client Secret"
    echo "3. Generate an access token using one of the following methods:"
    echo ""
    echo "   Using cURL:"
    echo "   curl -v https://api-m.sandbox.paypal.com/v1/oauth2/token \\"
    echo "     -H \"Accept: application/json\" \\"
    echo "     -H \"Accept-Language: en_US\" \\"
    echo "     -u \"CLIENT_ID:CLIENT_SECRET\" \\"
    echo "     -d \"grant_type=client_credentials\""
    echo ""
    echo "4. Copy the 'access_token' value from the response"
    echo "5. Open the .env file and paste your access token after PAYPAL_ACCESS_TOKEN="
fi

echo ""
echo "Once you have an access token in the .env file, you can run the server using:"
echo "bash $(pwd)/mcp/paypal-agent-toolkit/run.sh"
echo ""
echo "Setup completed successfully! ✓"