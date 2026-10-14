import api from "../base/api";

import type { UploadResponse } from "./upload.types";

// ========================================
// UPLOADS
//
// Files go to Cloudinary through the API;
// the response is the public URL to save
// on the record. Both answer 503 until the
// server's CLOUDINARY_* settings are set.
// ========================================

// POST /api/upload — a photo, up to 5 MB.
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file, file.name);

  const response = await api.post<UploadResponse>("/api/upload", formData);

  if (!response.data.imageUrl) {
    throw new Error("Image upload failed");
  }

  return response.data.imageUrl;
}

// POST /api/upload/document — a PDF, up
// to 15 MB.
export async function uploadDocument(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("document", file, file.name);

  const response = await api.post<UploadResponse>("/api/upload/document", formData);

  if (!response.data.fileUrl) {
    throw new Error("Document upload failed");
  }

  return response.data.fileUrl;
}
