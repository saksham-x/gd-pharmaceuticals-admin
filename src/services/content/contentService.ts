import api from "../base/api";

// ========================================
// WEBSITE CONTENT
//
// Every page's copy as one nested object.
// Its shape comes from the API's defaults,
// so the portal never hard-codes it.
// ========================================

export type ContentValue = string | boolean | ContentValue[] | { [key: string]: ContentValue };

export type ContentSection = Record<string, ContentValue>;

export type SiteContent = Record<string, ContentSection>;

export async function getSiteContent() {
  const response = await api.get<{ content: SiteContent; defaults: SiteContent }>("/api/site-settings/admin");
  return response.data;
}

// Saves one section (one tab); other
// sections are untouched.
export async function saveSection(section: string, value: ContentSection) {
  const response = await api.put<SiteContent>("/api/site-settings", { [section]: value });
  return response.data;
}

// Back to the launch text.
export async function resetSection(section: string) {
  const response = await api.delete<SiteContent>(`/api/site-settings/${section}`);
  return response.data;
}
