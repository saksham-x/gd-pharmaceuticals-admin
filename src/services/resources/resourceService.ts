import api from "../base/api";

// ========================================
// WEBSITE RESOURCES
//
// Products, notices, careers and legal
// pages share one shape of API:
//   GET    /api/<name>/admin/all
//   POST   /api/<name>
//   PUT    /api/<name>/:id
//   DELETE /api/<name>/:id
//   PUT    /api/<name>/:id/<flag>   (toggle)
// ========================================

export type Product = {
  _id: string;
  name: string;
  slug: string;
  genericName: string;
  form: string;
  dosageForm: string;
  subtitle: string;
  packSize: string;
  composition: string;
  registration: string;
  medicineInfo: string;
  color: "blue" | "green";
  featured: boolean;
  published: boolean;
  order: number;
  updatedAt: string;
};

export const NOTICE_CATEGORIES = [
  { value: "notice", label: "Notices" },
  { value: "financial-report", label: "Financial Reports" },
  { value: "ipo-update", label: "IPO Updates" },
  { value: "governance", label: "Corporate Governance" },
] as const;

export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number]["value"];

export type Notice = {
  _id: string;
  title: string;
  summary: string;
  type: string;
  date: string;
  category: NoticeCategory;
  subject: string;
  outcome: string;
  documentUrl: string;
  showOnNews: boolean;
  newsTitle: string;
  newsSummary: string;
  image: string;
  showOnHome: boolean;
  published: boolean;
  updatedAt: string;
};

export type Career = {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  summary: string;
  responsibilities: string[];
  badge: string;
  active: boolean;
  order: number;
  updatedAt: string;
};

export type LegalPage = {
  _id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
  updatedAt: string;
};

export function resourceService<T extends { _id: string }>(name: string) {
  const base = `/api/${name}`;

  return {
    list: async () => (await api.get<T[]>(`${base}/admin/all`)).data,
    create: async (payload: Partial<T>) => (await api.post<T>(base, payload)).data,
    update: async (id: string, payload: Partial<T>) => (await api.put<T>(`${base}/${id}`, payload)).data,
    remove: async (id: string) => {
      await api.delete(`${base}/${id}`);
    },
    toggle: async (id: string, flag: string) => (await api.put<T>(`${base}/${id}/${flag}`)).data,
  };
}

export const productService = resourceService<Product>("products");
export const noticeService = resourceService<Notice>("notices");
export const careerService = resourceService<Career>("careers");
export const legalPageService = resourceService<LegalPage>("legal-pages");
