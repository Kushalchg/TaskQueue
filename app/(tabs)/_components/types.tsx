
export type TaskStatus = "pending" | "processing" | "failed" | "completed";

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  retries: number;
  uri?: string; // add this for image preview
}
