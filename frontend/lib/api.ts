"use client";

// Base URL for the FastAPI backend
const API_BASE_URL = "http://localhost:5000";

export const signIn = async (email: string, password: string) => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/sign_in`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to sign in");
  }

  return response.json();
};

export const signUp = async (email: string, password: string) => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/sign_up`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to sign up");
  }

  return response.json();
};

export const uploadFile = async (userId: string, sessionId: string, session: any, files: File[]) => {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("session_id", sessionId);
  formData.append("session", JSON.stringify(session));
  files.forEach((file) => {
    formData.append("file", file);
  });

  const response = await fetch(`${API_BASE_URL}/file`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to upload files");
  }

  return response.json();
};

export const queryAssistant = async (
  query: string, 
  userId: string, 
  sessionId: string, 
  session: any, 
  summary: string[] = [], 
  filename: string[] = []
) => {
  const formData = new FormData();
  formData.append("query", query);
  formData.append("user_id", userId);
  formData.append("session_id", sessionId);
  formData.append("session", JSON.stringify(session));
  summary.forEach(s => formData.append("summary", s));
  filename.forEach(f => formData.append("filename", f));

  const response = await fetch(`${API_BASE_URL}/query`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to query assistant");
  }

  return response.body; // Return readable stream
};

export const resetSession = async (userId: string, sessionId: string, session: any) => {
  try {
    const params = new URLSearchParams({
      user_id: userId,
      session_id: sessionId,
      session: JSON.stringify(session),
      Delete: "true",
    });

    const response = await fetch(`${API_BASE_URL}/new_session?${params.toString()}`, {
      method: "DELETE",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Reset Session Error Response:", errorText);
      throw new Error(`Failed to reset session: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Fetch Error in resetSession:", error);
    throw error;
  }
};
