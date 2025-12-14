export type TaskStatus = "pending" | "processing" | "completed" | "failed";

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  retries: number;
  uri: string;
}
