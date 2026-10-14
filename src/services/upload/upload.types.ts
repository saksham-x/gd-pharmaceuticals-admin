// ========================================
// UPLOAD TYPES
//
// The backend responds with
// { imageUrl } for photos and
// { fileUrl } for PDFs.
// ========================================

export type UploadResponse = {
  imageUrl?: string;
  fileUrl?: string;
};
