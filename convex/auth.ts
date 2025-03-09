import { ConvexError } from "convex/values";

/**
 * Get authenticated user ID from Clerk session
 */
/**
 * Get authenticated user ID from Clerk session
 * @throws {ConvexError} If user is not authenticated or token is invalid
 */
export async function getAuthenticatedUser(ctx: { auth: any }): Promise<string> {
  console.log('Getting authenticated user...');
  try {
    const identity = await ctx.auth.getUserIdentity();
    console.log('Auth identity:', identity);
    
    if (!identity) {
      console.error('No identity found in auth context');
      throw new ConvexError(
        "Not authenticated - please sign in. " +
        "This may happen if your session has expired or if you're not properly logged in."
      );
    }
    
    // Use the subject claim which is the user ID
    const userId = identity.subject;
    if (!userId) {
      console.error("Auth error: No user ID in token", identity);
      throw new ConvexError(
        "Invalid authentication token - missing user ID. " +
        "This may be due to an invalid or corrupted session. Please try signing out and back in."
      );
    }

    // Validate user ID format and length
    if (
      typeof userId !== 'string' || 
      userId.trim() === '' || 
      userId.length < 3 || 
      userId.length > 128 || 
      !/^[a-zA-Z0-9_-]+$/.test(userId)
    ) {
      console.error("Auth error: Invalid user ID format", { userId });
      throw new ConvexError(
        "Invalid user ID format. " +
        "Please ensure you're using a valid account and try signing out and back in."
      );
    }

    console.log('Successfully authenticated user:', userId);
    return userId;
  } catch (error) {
    console.error('Error in getAuthenticatedUser:', error);
    if (error instanceof ConvexError) {
      throw error;
    }
    throw new ConvexError(
      "Authentication failed - an unexpected error occurred. " +
      "Please try refreshing the page or signing out and back in."
    );
  }
}

/**
 * Validate user has access to a resource
 */
/**
 * Validate user has access to a resource
 * @throws {ConvexError} If user is not authorized to access the resource
 */
export async function validateUserAccess(
  ctx: { auth: any },
  resourceUserId: string
): Promise<void> {
  console.log('Validating user access...');
  console.log('Resource user ID:', resourceUserId);
  
  // Validate resourceUserId
  if (!resourceUserId || typeof resourceUserId !== 'string' || resourceUserId.trim() === '') {
    console.error('Invalid resource user ID:', resourceUserId);
    throw new ConvexError(
      "Invalid resource user ID. " +
      "This may indicate a data integrity issue. Please refresh the page and try again."
    );
  }

  try {
    const userId = await getAuthenticatedUser(ctx);
    console.log('Authenticated user ID:', userId);
    
    if (userId !== resourceUserId) {
      console.error('Access denied - User IDs do not match:', { userId, resourceUserId });
      throw new ConvexError(
        "Unauthorized - You don't have permission to access this resource. " +
        "This resource belongs to a different user."
      );
    }
    
    console.log('Access validation successful');
  } catch (error) {
    console.error("Access validation error:", { error, resourceUserId });
    if (error instanceof ConvexError) {
      throw error;
    }
    throw new ConvexError(
      "Access validation failed - an unexpected error occurred. " +
      "Please refresh the page and try again."
    );
  }
}
