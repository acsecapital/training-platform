import {GetServerSideProps, GetServerSidePropsContext} from "next";
import {parseCookies} from "nookies";
import {firestore} from "@/services/firebase";
import {doc, getDoc} from "firebase/firestore";

/**
 * Higher-order function to wrap getServerSideProps with authentication check
 * Redirects to login page if user is not authenticated
 * @param {GetServerSideProps} gssp The original getServerSideProps function
 * @return {Function} A wrapped getServerSideProps function with authentication
 */
export const withAuth = (gssp: GetServerSideProps) => {
  return async (context: GetServerSidePropsContext) => {
    // Get the user's token from cookies
    const cookies = parseCookies(context);
    const token = cookies.token;

    // If there's no token, redirect to login page
    if (!token) {
      return {
        redirect: {
          destination: "/auth/login?redirect=" +
            encodeURIComponent(context.resolvedUrl),
          permanent: false,
      },
    };
  }

    try {
      // Verify the token and get the user ID
      // This is a simplified example - in a real app, you'd verify the token
      // with Firebase Auth
      const userId = cookies.userId;
      if (!userId) {
        throw new Error("Invalid token");
    }

      // Get the user data from Firestore
      const userRef = doc(firestore, `users/${userId}`);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        throw new Error("User not found");
    }

      // Call the original getServerSideProps function
      return await gssp(context);
  } catch (error) {
      console.error("Authentication error:", error);
      // If there's an error, clear the cookies and redirect to login
      context.res.setHeader(
        "Set-Cookie",
        [
          "token=; Max-Age=0; Path=/; HttpOnly",
          "userId=; Max-Age=0; Path=/; HttpOnly",
        ]
      );

      return {
        redirect: {
          destination: "/auth/login?redirect=" +
            encodeURIComponent(context.resolvedUrl),
          permanent: false,
      },
    };
  }
};
};

/**
 * Higher-order function to wrap getServerSideProps with admin authentication
 * check
 * Redirects to login page if user is not authenticated or not an admin
 * @param {GetServerSideProps} gssp The original getServerSideProps function
 * @return {Function} A wrapped getServerSideProps function with admin
 *   authentication
 */
export const withAdminAuth = (gssp: GetServerSideProps) => {
  return async (context: GetServerSidePropsContext) => {
    // Get the user's token from cookies
    const cookies = parseCookies(context);
    const token = cookies.token;

    // If there's no token, redirect to login page
    if (!token) {
      return {
        redirect: {
          destination: "/auth/login?redirect=" +
            encodeURIComponent(context.resolvedUrl),
          permanent: false,
      },
    };
  }

    try {
      // Verify the token and get the user ID
      // This is a simplified example - in a real app, you'd verify the token
      // with Firebase Auth
      const userId = cookies.userId;
      if (!userId) {
        throw new Error("Invalid token");
    }

      // Get the user data from Firestore
      const userRef = doc(firestore, `users/${userId}`);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        throw new Error("User not found");
    }

      // Check if the user is an admin
      const userData = userSnapshot.data() as { roles?: { admin?: boolean } }; // Type assertion for userData
      const isAdmin = userData?.roles?.admin === true;

      if (!isAdmin) {
        return {
          redirect: {
            destination: "/dashboard",
            permanent: false,
        },
      };
    }

      // Call the original getServerSideProps function
      return await gssp(context);
  } catch (error) {
      console.error("Authentication error:", error);
      // If there's an error, clear the cookies and redirect to login
      context.res.setHeader(
        "Set-Cookie",
        [
          "token=; Max-Age=0; Path=/; HttpOnly",
          "userId=; Max-Age=0; Path=/; HttpOnly",
        ]
      );

      return {
        redirect: {
          destination: "/auth/login?redirect=" +
            encodeURIComponent(context.resolvedUrl),
          permanent: false,
        },
      };
    }
  };
};
