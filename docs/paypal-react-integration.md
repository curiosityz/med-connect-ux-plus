# Integrating PayPal Payments in React

This guide will help you understand how to integrate PayPal payments into your React components.

## Prerequisites

1. A PayPal Business account
2. PayPal API credentials (Client ID and Secret)
3. React application

## Step 1: Install Required Packages

```bash
npm install @paypal/react-paypal-js
```

## Step 2: Set Up PayPal Provider

Wrap your application (or the part that needs PayPal integration) with the `PayPalScriptProvider`:

```jsx
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const initialOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  currency: "USD",
  // Optional configuration options
  // intent: "capture", // or "authorize"
  // "data-client-token": "your-client-token", // for vault integrations
  // "enable-funding": "venmo,card", // to enable specific funding sources
  // "disable-funding": "credit,card", // to disable specific funding sources
};

function App() {
  return (
    <PayPalScriptProvider options={initialOptions}>
      {/* Your application components */}
    </PayPalScriptProvider>
  );
}
```

## Step 3: Create Order Function

Create a function to handle order creation:

```jsx
const createOrder = (amount, description) => async () => {
  try {
    const response = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        description,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.id; // Return the PayPal order ID
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};
```

## Step 4: Handle Payment Approval

Create a function to handle payment approval:

```jsx
const handleApprove = async (data, actions, planType) => {
  try {
    // Capture the payment
    const details = await actions.order.capture();
    
    // Verify the payment on your server
    const response = await fetch('/api/paypal/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderID: details.id,
        planType: planType,
      }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Payment successful
      console.log('Payment successful:', result);
      // Update UI or redirect user
      return true;
    } else {
      // Payment verification failed
      throw new Error(result.error || 'Payment verification failed');
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    // Handle error (show error message, etc.)
    return false;
  }
};
```

## Step 5: Add PayPal Buttons to Your Component

```jsx
import { PayPalButtons } from "@paypal/react-paypal-js";

function PaymentComponent() {
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div>
      <h2>Complete Your Purchase</h2>
      <p>Total: $49.99</p>
      
      <PayPalButtons
        style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
        createOrder={createOrder("49.99", "Premium Plan")}
        onApprove={(data, actions) => {
          setIsProcessing(true);
          return handleApprove(data, actions, "Premium")
            .then((success) => {
              if (success) {
                // Show success message or redirect
              } else {
                // Show error message
              }
            })
            .finally(() => {
              setIsProcessing(false);
            });
        }}
        onError={(err) => {
          console.error('PayPal Button error:', err);
          // Handle error
        }}
        disabled={isProcessing}
      />
    </div>
  );
}
```

## Step 6: Handle Different Payment Scenarios

### Successful Payment

When a payment is successful:

1. The `onApprove` callback is triggered
2. The payment is captured using `actions.order.capture()`
3. The payment is verified on your server
4. The user's account is updated with the purchased plan
5. The user is shown a success message or redirected to a success page

### Failed Payment

When a payment fails:

1. The `onError` callback is triggered
2. The error is logged
3. The user is shown an error message
4. The user can try again or contact support

## Step 7: Testing

PayPal provides sandbox accounts for testing:

1. Log in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Navigate to the "Sandbox" > "Accounts" section
3. Use the sandbox accounts for testing payments

## Complete Example

Here's a complete example of a pricing component with PayPal integration:

```jsx
import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// Define createOrder function
const createOrder = (amount, description) => async () => {
  try {
    const response = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        description,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export default function PricingComponent() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: "USD",
  };

  const handleApprove = async (data, actions, plan) => {
    try {
      setIsProcessing(true);
      const details = await actions.order.capture();
      
      const response = await fetch('/api/paypal/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: details.id,
          planType: plan,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Thank you for purchasing the ${plan} plan!` });
        return true;
      } else {
        throw new Error(result.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to process payment' });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = (err) => {
    console.error('PayPal Button error:', err);
    setMessage({ type: 'error', text: 'PayPal encountered an error. Please try again or contact support.' });
    setIsProcessing(false);
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="pricing-container">
        <h1>Choose Your Plan</h1>
        
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <div className="pricing-plans">
          <div className="plan">
            <h2>Basic Plan</h2>
            <p className="price">$19.95</p>
            <ul>
              <li>Feature 1</li>
              <li>Feature 2</li>
              <li>Feature 3</li>
            </ul>
            <PayPalButtons
              style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
              createOrder={createOrder("19.95", "Basic Plan")}
              onApprove={(data, actions) => handleApprove(data, actions, "Basic")}
              onError={handleError}
              disabled={isProcessing}
            />
          </div>
          
          <div className="plan featured">
            <h2>Premium Plan</h2>
            <p className="price">$49.99</p>
            <ul>
              <li>All Basic features</li>
              <li>Premium Feature 1</li>
              <li>Premium Feature 2</li>
              <li>Premium Feature 3</li>
            </ul>
            <PayPalButtons
              style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
              createOrder={createOrder("49.99", "Premium Plan")}
              onApprove={(data, actions) => handleApprove(data, actions, "Premium")}
              onError={handleError}
              disabled={isProcessing}
            />
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
```

## Additional Resources

- [PayPal React SDK Documentation](https://paypal.github.io/react-paypal-js/)
- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Checkout Integration Guide](https://developer.paypal.com/docs/checkout/)