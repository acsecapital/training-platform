import {NextApiRequest, NextApiResponse} from "next";
import {parseCookies} from "nookies";
import {firestore} from "@/services/firebase";
import {doc, getDoc} from "firebase/firestore";

// Define a type for the user data
interface UserData {
  id: string;
  roles?: {// Assuming roles is an optional object
    admin?: boolean; // Assuming admin is an optional boolean property
    [key: string]: unknown; // Allow other role properties
};
  [key: string]: unknown; // Allow other top-level properties from Firestore
}

// Extend NextApiRequest to include the user property
interface AuthenticatedRequest extends NextApiRequest {
  user: UserData;
}

/**
 * Type for authenticated Next.js API handlers
 */
type AuthenticatedNextApiHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void>;

/**
 * Higher-order function to wrap API handlers with authentication check
 * @param handler The API handler function that requires authentication
 * @return A wrapped handler function with authentication check
 */
export const withAuth = (handler: AuthenticatedNextApiHandler) => {
  const wrappedHandler: AuthenticatedNextApiHandler = async (req, res) => {
    try {
      // Get the user's token from cookies
      const cookies = parseCookies({req});
      const token = cookies.token;

      // If there's no token, return unauthorized
      if (!token) {
        return res.status(401).json({error: "Unauthorized"});
    }

      // Verify the token and get the user ID
      // This is a simplified example - in a real app, you'd verify the token
      // with Firebase Auth
      const userId = cookies.userId;

      if (!userId) {
        return res.status(401).json({error: "Invalid token"});
    }

      // Get the user data from Firestore
      const userRef = doc(firestore, `users/${userId}`);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        return res.status(401).json({error: "User not found"});
    }

      // Add user data to request object
      (req).user = {
        // id is already included in userSnapshot.data()
        ...(userSnapshot.data() as UserData), // Cast data to UserData type
    };

      // Call the original handler
      return handler(req, res);
  } catch (error) {
      console.error("API authentication error:", error);
      return res.status(401).json({error: "Authentication failed"});
  }
};

  return wrappedHandler;
};

/**
 * Higher-order function to wrap API handlers with admin authentication check
 * @param handler The API handler function that requires admin authentication
 * @return A wrapped handler function with admin authentication check
 */
export function withAdminAuth(handler: AuthenticatedNextApiHandler) {
  const wrappedHandler: AuthenticatedNextApiHandler = async (req, res) => {
    try {
      // Get the user's token from cookies
      const cookies = parseCookies({req});
      const token = cookies.token;

      // If there's no token, return unauthorized
      if (!token) {
        return res.status(401).json({error: "Unauthorized"});
    }

      // Verify the token and get the user ID
      // This is a simplified example - in a real app, you'd verify the token
      // with Firebase Auth
      const userId = cookies.userId;

      if (!userId) {
        return res.status(401).json({error: "Invalid token"});
    }

      // Get the user data from Firestore
      const userRef = doc(firestore, `users/${userId}`);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        return res.status(401).json({error: "User not found"});
    }

      const userData = userSnapshot.data() as UserData;

      // Check if the user is an admin
      if (!userData.roles?.admin) {
        return res.status(403).json({
          error: "Forbidden: Admin access required",
      });
    }

      // Add user data to request object
      const authenticatedReq = req;
      authenticatedReq.user = {
        ...userData,
    };

      // Call the original handler
      return handler(authenticatedReq, res);
  } catch (error) {
      console.error("API authentication error:", error);
      return res.status(401).json({error: "Authentication failed"});
  }
};

  return wrappedHandler;
}
