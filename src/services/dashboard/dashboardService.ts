import api from "../base/api";
import type { Enquiry } from "../enquiry/enquiryService";
import type { Task } from "../task/taskService";

export type Dashboard = {
  stats: {
    newEnquiries: number;
    // Last 30 days against the 30 before,
    // in percent; null with nothing to
    // compare.
    enquiryChange: number | null;
    openTasks: number;
    dueToday: number;
    overdue: number;
    awaitingReview: number;
  };
  // One entry per day, oldest first.
  volume: { date: string; count: number }[];
  recentEnquiries: Enquiry[];
  myTasks: Task[];
};

export async function getDashboard() {
  const response = await api.get<Dashboard>("/api/dashboard");
  return response.data;
}
