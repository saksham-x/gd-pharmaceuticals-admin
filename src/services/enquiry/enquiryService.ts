import api from "../base/api";

// ========================================
// ENQUIRIES
//
// Created by the website contact form
// (or by staff for a phone enquiry) and
// worked through New → Closed.
// ========================================

export const ENQUIRY_TYPES = [
  "General enquiry",
  "Product enquiry",
  "Distributor enquiry",
  "Investor enquiry",
  "Careers",
  "Pharmacovigilance",
] as const;

export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const ENQUIRY_STATUSES = ["New", "Contacted", "Assigned", "In Progress", "Closed"] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export type Owner = { _id: string; name: string; email: string };

export type Enquiry = {
  _id: string;
  reference: string;
  name: string;
  email: string;
  phone: string;
  type: EnquiryType;
  message: string;
  product: string;
  status: EnquiryStatus;
  owner: Owner | null;
  notes: string;
  source: "website" | "staff";
  createdAt: string;
  updatedAt: string;
};

export type EnquiryFilters = {
  search?: string;
  status?: string;
  type?: string;
};

export type ManualEnquiryPayload = {
  name: string;
  email: string;
  phone: string;
  type: EnquiryType;
  message: string;
  owner: string;
  status: EnquiryStatus;
};

export type EnquiryUpdatePayload = Partial<{
  status: EnquiryStatus;
  owner: string | null;
  notes: string;
  type: EnquiryType;
}>;

// Fired after the portal changes an
// enquiry, so the sidebar badge refreshes
// at once instead of on its next poll.
export const ENQUIRIES_CHANGED_EVENT = "enquiries:changed";

const notifyChanged = () => window.dispatchEvent(new Event(ENQUIRIES_CHANGED_EVENT));

export async function getEnquiries(filters: EnquiryFilters = {}) {
  const response = await api.get<Enquiry[]>("/api/enquiries", { params: filters });
  return response.data;
}

// Staff an enquiry or task can be
// assigned to.
export async function getOwners() {
  const response = await api.get<Owner[]>("/api/enquiries/owners");
  return response.data;
}

export async function getPendingEnquiryCount(): Promise<number> {
  const response = await api.get<{ count: number }>("/api/enquiries/pending-count");
  return response.data.count;
}

export async function createManualEnquiry(payload: ManualEnquiryPayload) {
  const response = await api.post<Enquiry>("/api/enquiries/manual", {
    ...payload,
    owner: payload.owner || null,
  });
  notifyChanged();
  return response.data;
}

export async function updateEnquiry(id: string, payload: EnquiryUpdatePayload) {
  const response = await api.put<Enquiry>(`/api/enquiries/${id}`, payload);
  notifyChanged();
  return response.data;
}

export async function deleteEnquiry(id: string) {
  await api.delete(`/api/enquiries/${id}`);
  notifyChanged();
}
