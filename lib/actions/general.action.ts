"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(params: { userId?: string }) {
  const { userId } = params || {};

  let queryRef = db.collection("interviews");

  // Apply filters that do not force composite indexes
  if (userId) {
    queryRef = queryRef.where("userId", "==", userId);
  }

  // Do NOT use orderBy here to avoid composite index requirement
  const snapshot = await queryRef.get();

  const interviews = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));

  // Sort in memory by createdAt desc
  interviews.sort((a, b) => {
    const aTime = new Date(a?.createdAt ?? 0).getTime();
    const bTime = new Date(b?.createdAt ?? 0).getTime();
    return bTime - aTime;
  });

  return interviews as Interview[];
}

export async function getInterviewsByUserId(userId: string) {
  if (!userId) {
    throw new Error("userId is required");
  }
  const snapshot = await db
    .collection("interviews")
    .where("userId", "==", userId)
    // Removed orderBy to avoid composite index requirement
    .get();

  const interviews = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));

  // Sort in memory by createdAt descending
  interviews.sort((a, b) => {
    const aTime = new Date(a.createdAt ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? 0).getTime();
    return bTime - aTime;
  });

  return interviews as Interview[];
}

// Save interview transcript and completion data
export async function saveInterviewData(params: {
  interviewId: string;
  userId: string;
  transcript: Array<{ role: string; content: string }>;
}) {
  const { interviewId, userId, transcript } = params;

  try {
    if (!interviewId) {
      console.error("Interview ID is required");
      return { success: false, message: "Interview ID is required" };
    }

    if (!userId) {
      console.error("User ID is required");
      return { success: false, message: "User ID is required" };
    }

    // Get existing interview data first to preserve it
    const interviewDoc = await db.collection("interviews").doc(interviewId).get();
    const existingData = interviewDoc.exists ? interviewDoc.data() : {};

    // Update the interview document with transcript and completion data
    // Preserve existing fields and only update/add new ones
    await db.collection("interviews").doc(interviewId).set({
      ...existingData, // Preserve existing data
      transcript: transcript,
      completedAt: new Date().toISOString(),
      status: "completed",
      finalized: true, // Mark as finalized
      updatedAt: new Date().toISOString(),
      userId: userId, // Ensure userId is set
    }, { merge: true });

    console.log("✅ Interview data saved successfully:", interviewId);
    return { success: true, message: "Interview data saved successfully" };
  } catch (error: any) {
    console.error("❌ Error saving interview data:", error);
    return { success: false, message: error?.message || "Failed to save interview data" };
  }
}

// Create a new interview document for generate type interviews
export async function createInterviewDocument(params: {
  userId: string;
  transcript?: Array<{ role: string; content: string }>;
}) {
  const { userId, transcript } = params;

  try {
    if (!userId) {
      console.error("User ID is required");
      return { success: false, message: "User ID is required" };
    }

    const interviewData: any = {
      userId: userId,
      role: "AI Generated Interview",
      type: "Mixed",
      level: "Intermediate",
      techstack: [],
      questions: [],
      finalized: true,
      status: transcript && transcript.length > 0 ? "completed" : "pending",
      coverImage: "/pattern.png",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (transcript && transcript.length > 0) {
      interviewData.transcript = transcript;
      interviewData.completedAt = new Date().toISOString();
    }

    const interviewRef = await db.collection("interviews").add(interviewData);
    console.log("✅ New interview document created:", interviewRef.id);

    return { success: true, interviewId: interviewRef.id };
  } catch (error: any) {
    console.error("❌ Error creating interview document:", error);
    return { success: false, message: error?.message || "Failed to create interview document" };
  }
}
