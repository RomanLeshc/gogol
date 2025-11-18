/**
 * Firebase Configuration and Authentication
 * Initializes Firebase using app config from backend
 *
 * @format
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  Auth,
} from "firebase/auth";
import { ModelApp } from "./types";

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;

/**
 * Extract Firebase config object from JavaScript code string
 * Handles various formats like:
 * - export const firebaseConfig = {...}
 * - const firebaseConfig = {...}
 * - module.exports = {...}
 * - export default {...}
 */
function extractFirebaseConfigFromJS(jsString: string): any {
  // Remove comments (single-line and multi-line)
  let cleaned = jsString
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove /* ... */ comments
    .replace(/\/\/.*$/gm, ""); // Remove // comments

  // Helper function to extract balanced braces
  function extractBalancedBraces(
    str: string,
    startIndex: number
  ): string | null {
    if (str[startIndex] !== "{") return null;

    let depth = 0;
    let i = startIndex;

    while (i < str.length) {
      if (str[i] === "{") depth++;
      if (str[i] === "}") {
        depth--;
        if (depth === 0) {
          return str.substring(startIndex, i + 1);
        }
      }
      // Skip strings to avoid counting braces inside strings
      if (str[i] === '"' || str[i] === "'" || str[i] === "`") {
        const quote = str[i];
        i++;
        while (i < str.length && str[i] !== quote) {
          if (str[i] === "\\") i++; // Skip escaped quotes
          i++;
        }
      }
      i++;
    }

    return null;
  }

  // Pattern 1: export const firebaseConfig = {...} or const firebaseConfig = {...}
  const configVarPattern =
    /(?:export\s+)?(?:const|let|var)\s+firebaseConfig\s*=\s*/i;
  const varMatch = cleaned.match(configVarPattern);
  if (varMatch) {
    const startIndex = varMatch.index! + varMatch[0].length;
    const objStr = extractBalancedBraces(cleaned, startIndex);
    if (objStr) {
      try {
        return JSON.parse(objStr);
      } catch (e) {
        try {
          // Use Function constructor instead of eval for better security
          return new Function(`return ${objStr}`)();
        } catch (funcError) {
          console.error("Failed to parse firebaseConfig object:", funcError);
        }
      }
    }
  }

  // Pattern 2: module.exports = {...} or export default {...}
  const exportPattern = /(?:module\.exports|export\s+default)\s*=\s*/i;
  const exportMatch = cleaned.match(exportPattern);
  if (exportMatch) {
    const startIndex = exportMatch.index! + exportMatch[0].length;
    const objStr = extractBalancedBraces(cleaned, startIndex);
    if (objStr) {
      try {
        return JSON.parse(objStr);
      } catch (e) {
        try {
          return new Function(`return ${objStr}`)();
        } catch (funcError) {
          console.error("Failed to parse export object:", funcError);
        }
      }
    }
  }

  // Pattern 3: Look for any object containing Firebase config keys
  const configKeys = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];

  // Find all potential object starts
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "{") {
      const objStr = extractBalancedBraces(cleaned, i);
      if (objStr) {
        // Check if this object contains Firebase config keys
        const hasAllKeys = configKeys.every(
          (key) =>
            objStr.includes(`"${key}"`) ||
            objStr.includes(`'${key}'`) ||
            objStr.includes("`" + key + "`") ||
            objStr.includes(`${key}:`)
        );

        if (hasAllKeys) {
          try {
            return JSON.parse(objStr);
          } catch (e) {
            try {
              return new Function(`return ${objStr}`)();
            } catch (funcError) {
              // Continue searching
            }
          }
        }
      }
    }
  }

  throw new Error("Could not extract Firebase config from JavaScript string");
}

/**
 * Initialize Firebase using config from app
 */
export function initializeFirebase(
  appConfig: ModelApp | null
): FirebaseApp | null {
  // If already initialized, return existing app
  if (firebaseApp) {
    return firebaseApp;
  }

  if (!appConfig) {
    console.warn("⚠️ Cannot initialize Firebase: app config is null");
    return null;
  }

  // Try to get Firebase config from app config
  let firebaseConfig = appConfig.firebaseConfigParsed;

  // If parsed config doesn't exist, try parsing the string
  if (!firebaseConfig && appConfig.firebaseWebConfigString) {
    try {
      // First try JSON parsing
      firebaseConfig = JSON.parse(appConfig.firebaseWebConfigString);
    } catch (jsonError) {
      // If JSON parsing fails, try to extract config from JavaScript code
      try {
        firebaseConfig = extractFirebaseConfigFromJS(
          appConfig.firebaseWebConfigString
        );
      } catch (jsError) {
        console.error(
          "❌ Failed to parse firebaseWebConfigString as JSON or JS:",
          jsonError
        );
        console.error(
          "Original string preview:",
          appConfig.firebaseWebConfigString.substring(0, 200)
        );
        return null;
      }
    }
  }

  if (!firebaseConfig) {
    console.warn("⚠️ Firebase config not found in app config");
    return null;
  }

  // Check if Firebase is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    auth = getAuth(firebaseApp);
    return firebaseApp;
  }

  try {
    // Initialize Firebase
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);

    console.log("✅ Firebase initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
    return null;
  }
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth | null {
  if (!auth && firebaseApp) {
    auth = getAuth(firebaseApp);
  }
  return auth;
}

/**
 * Try to initialize Firebase from store if not already initialized
 */
export async function ensureFirebaseInitialized(): Promise<boolean> {
  // If already initialized, return true
  if (firebaseApp && auth) {
    return true;
  }

  // Try to get app config from store
  try {
    // Use dynamic import to avoid circular dependencies
    const { useAppStore } = await import("./store");
    const currentApp = useAppStore.getState().currentApp;

    if (currentApp) {
      const result = initializeFirebase(currentApp);
      return result !== null;
    } else {
      console.warn("⚠️ currentApp is null in store");
    }
  } catch (error) {
    console.error("❌ Failed to get app config from store:", error);
  }

  return false;
}

/**
 * Sign in with Google using Firebase
 */
export async function signInWithGoogle(): Promise<{
  idToken: string;
  accessToken: string;
  user: User;
} | null> {
  // Ensure Firebase is initialized before attempting sign-in
  if (!isFirebaseInitialized()) {
    console.log(
      "⚠️ Firebase not initialized, attempting to initialize from store..."
    );
    const initialized = await ensureFirebaseInitialized();

    if (!initialized) {
      // Try to get diagnostic info
      try {
        const { useAppStore } = await import("./store");
        const currentApp = useAppStore.getState().currentApp;
        console.error("❌ Firebase initialization failed. App config:", {
          hasCurrentApp: !!currentApp,
          hasFirebaseConfig: !!(
            currentApp?.firebaseWebConfigString ||
            currentApp?.firebaseConfigParsed
          ),
          firebaseConfigKeys: currentApp
            ? Object.keys(currentApp).filter((k) => k.includes("firebase"))
            : [],
        });
      } catch (e) {
        console.error("❌ Failed to get diagnostic info:", e);
      }
      throw new Error(
        "Firebase Auth not initialized. Please ensure app config includes Firebase configuration. If the issue persists, please refresh the page."
      );
    }
  }

  const firebaseAuth = getFirebaseAuth();

  if (!firebaseAuth) {
    throw new Error(
      "Firebase Auth not initialized. Please ensure app config includes Firebase configuration."
    );
  }

  const provider = new GoogleAuthProvider();

  // Request additional scopes if needed
  provider.addScope("profile");
  provider.addScope("email");

  try {
    const result = await signInWithPopup(firebaseAuth, provider);
    const user = result.user;

    // Get the ID token
    const idToken = await user.getIdToken();

    // Get the access token from Google
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || "";

    return {
      idToken,
      accessToken,
      user,
    };
  } catch (error: any) {
    console.error("❌ Google sign-in error:", error);

    // Handle specific error cases
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in popup was closed");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error(
        "Sign-in popup was blocked. Please allow popups for this site."
      );
    } else if (error.code === "auth/cancelled-popup-request") {
      throw new Error("Sign-in was cancelled");
    }

    throw error;
  }
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized(): boolean {
  return firebaseApp !== null && auth !== null;
}
