import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6956a8bd1e8e58e1fe9bf909", 
  requiresAuth: true // Ensure authentication is required for all operations
});
