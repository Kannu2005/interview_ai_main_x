import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// ✅ Debug log to verify environment variables (safe for dev)
console.log("FIREBASE ADMIN ENV:", {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKeyLoaded: !!process.env.FIREBASE_PRIVATE_KEY,
});

// ✅ Initialize Firebase Admin SDK only once
function initFirebaseAdmin() {
  const apps = getApps();

  if (!apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || 
      "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDKQZcrTV4PZVCz\nlYAJGJbYKupuTz3cZ47neqpIAmnXSJGnRJaka+tNu2YgagPPSTarlugS24rtx9zI\nQ1aAIuaNfMjuYI/nvpOqAbU6sYDHT9IQBexxCpoo+IKiZYZRJ2twPVQ6MiO4F9St\nyq8ZzAZrvytxZ9zQ7/SWD1KqjT55TJ5OPH0dNnGfnNDQOIEm71qhKnMdEk6HTCjq\nPJ8ydzUiCRBNZH0VoyehIS++qPi7APdNVhPDQ7brFj05T5945vHxM514mwj5c3Tn\nhnv6PKjyJ2wVbY952rTPNE+M6/30dwIEX0cOOEDBS/7VgU97cfzjsKgXTkmsOwVl\njH2/ssufAgMBAAECggEAWV0eqlLOTvYgcKCLCDnVmGBp4WBgwEv/T5aauyNZ2XWm\naWX8O1y1hExbJNJCqak7HxiXpJFdMo9+pPtfslD5ViV+8Bg5LRc+zjxf8zVvZWEG\nuu6rGA0rrROUQKWj8aJ9rYNjfi0eLB5XaYxmznqfkabPTpWp8qU7B7xwdYvfwR7I\nDLa6NTtzKC/pfPOOnLydVZ8DUmM32U5EmQiDFF55uPxdeplu+k4bYldLZbSPbFvo\nK3fGjn049C4nD/HC4nMAm7TTgA7bRC2OGoCkBi+O5qb5iAJRfLFIaHn1gAPDKacw\n1qIGNUtNoMWSAGAAwd0pUpwRyhxMct/10IbeW8aX3QKBgQD2tkgI5mqKy7Pb75RN\nAGM8Lvbxzqtv9oWcfCclQO5DMtxMrGGOYFqkz39Bg3xEGGYX5+0dIqI2qb7W6PU5\nxBEcUJ+MkPRkoUELkuIrow4TJKqodQZ6HGlefV9t18RnJD2t6uP4hLzWFHjPr0zM\nxgni6EQJD34lxELy8PEwUMKbOwKBgQDR3txHg9xa/+2OgZEJQ/RUbR1YlO8K+jFc\nL/DLb2AFHEROwxkeLU0p/s7E7l7BxfzPsQR13fUVNy2LgafZWyecn8G7SohdFkST\nr8aLnHMEWMaopPqoylwNTQFxtSS7YT7+3dIHLyVuagNNcD9HDmG0F+fyj8n24xJv\nDx72HY3i7QKBgQCsl+jdERUH9GnnOzvsgpDp0ZFAqOyWb0gZqWFZVotYx4QGv7Gg\nARhopCDKnEma+daycrYW49vHkgjIIEEuIFQ4Es8Lb30JySXQCvnevTtjeQtKvlPB\nqY6tY9gW6BOmdFwSB3lkqrfQrJG3+VMpDoJsE0FFdWky0pJjktuoiVcbcQKBgQCQ\nveIwVGnSPPYKtaNgv4QwAf0eTcE7UehfCxVISOzxOViG9ZlKLbYtQ3Y5bajefXzp\nhM1tuQHBewenUml/x5VfOPM1B6dag/QR40XMnb7ZfZytTPMvHDk2Vyiq0mKd9Ois\ngDHNEKABMY5LhyGtEOcjfOVUbgS9iEf7XnNdDG8B1QKBgCqpixXG+GqTEdCtqaB3\ncXqAPtCmtRMT/dUReueMyHRZhpgsZIqESKW9Y67qMjI1OIEHxVkIi2bFL3R7opAV\ndzplwlKY5LdytX/GmINlR81s1vbPUHZu6Pz+dtG8NmIQL+fvcmX6R6aLlXyUh8Rl\nFPzlCGdfNd8A6FcuyYiek0Cf\n-----END PRIVATE KEY-----\n";
    
    const projectId = String(process.env.FIREBASE_PROJECT_ID || "interview-b3909");
    const clientEmail = String(process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@interview-b3909.iam.gserviceaccount.com");
    const processedKey = String(privateKey).replace(/\\n/g, "\n");
    
    initializeApp({
      credential: cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: processedKey,
      }),
    });
  } 

  return {
    auth: getAuth(),
    db: getFirestore(),
  };
}

// ✅ Export Firebase Admin SDK auth and db
export const { auth, db } = initFirebaseAdmin();
