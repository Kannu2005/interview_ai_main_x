"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie (ID Token → Session Cookie)
export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION * 1000, // milliseconds
  });

  cookieStore.set("session", sessionCookie, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

// Sign up user (create Firestore document)
export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params;

  try {
    // check if user exists in db
    let exists = false;
    try {
      const userRecord = await db.collection("users").doc(uid).get();
      exists = userRecord.exists;
    } catch (e: any) {
      if (e?.code === 5 /* NOT_FOUND */) {
        console.log("Firestore NOT_FOUND during existence check; will create user doc:", uid);
      } else {
        console.log("❌ Firestore existence check error:", e);
      }
    }

    if (exists)
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };

    // save user to db
    await db.collection("users").doc(uid).set({
      name,
      email,
      // profileURL,
      // resumeURL,
    });
    console.log("User created in Firestore:", uid);

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: any) {
    console.error("Error creating user:", error?.code || "no-code", error?.message || error);

    // Handle Firebase specific errors
    if (error.code === "auth/email-already-exists") {
      return {
        success: false,
        message: "This email is already in use",
      };
    }

    return {
      success: false,
      message: error?.message || "Failed to create account. Please try again.",
    };
  }
}

// Sign in user (and create Firestore doc if missing)
export async function signIn(params: SignInParams) {
  const { email, idToken } = params;

  try {
    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord)
      return {
        success: false,
        message: "User does not exist. Create an account.",
      };

    // Set session cookie
    await setSessionCookie(idToken);

    // Ensure Firestore user document exists
    const uid = userRecord.uid;
    try {
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        await db.collection("users").doc(uid).set({
          name: userRecord.displayName || "",
          email: userRecord.email || email,
        });
        console.log("Created missing Firestore user doc:", uid);
      }
    } catch (firestoreError: any) {
      // If Firestore get() throws NOT_FOUND because DB isn't initialized yet, attempt creating the doc
      if (firestoreError?.code === 5 /* NOT_FOUND */) {
        try {
          await db.collection("users").doc(uid).set({
            name: userRecord.displayName || "",
            email: userRecord.email || email,
          });
          console.log("Created Firestore user doc after NOT_FOUND:", uid);
        } catch (createErr) {
          console.log("❌ Failed to create Firestore user doc after NOT_FOUND:", createErr);
        }
      } else {
        console.log("❌ Firestore user fetch error:", firestoreError);
      }
    }

    return { success: true, message: "Signed in successfully." };
  } catch (error: any) {
    console.log("❌ Sign in error:", error);

    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

// Sign out user by removing session cookie
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

// Get current authenticated user
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) return null;

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    const userRecord = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();

    if (!userRecord.exists) {
      console.warn("User document not found in Firestore for UID:", decodedClaims.uid);
      return null;
    }

    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error) {
    console.log("❌ Session verification error:", error);
    return null;
  }
}

// Helper: check if user is authenticated
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
