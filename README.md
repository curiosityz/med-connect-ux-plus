# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## PayPal Payment Integration

### Environment Variables
Add the following to your `.env` file:
```
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-client-secret
PAYPAL_WEBHOOK_ID=your-paypal-webhook-id
```

### Payment Flow
- Users can purchase either the Basic ($19.95) or Complete Access ($49.99) plan via PayPal on the `/pricing` page.
- Only authenticated users (via Clerk) can initiate payment.
- After payment approval, the frontend calls a backend endpoint to verify and capture the payment.
- PayPal webhooks are received at `/api/paypal/webhook` to confirm payment completion and update user status.

### Payment Status Storage
- User payment status is stored in the `user_payments` table in the database, keyed by Clerk user ID.
- The app checks this status to gate access to premium features and display plan info in the user profile.

### Webhooks
- Webhook URLs are listed in the `.env` file. You must configure these in your PayPal developer dashboard.

### Next Steps
- Implement backend logic to verify/capture payments and update user status.
- Implement access control in the app based on payment status.
