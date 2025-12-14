export interface Task {
  id: string;
  name: string;
  status: "pending" | "processing" | "completed" | "failed";
  retries: number;
  uri: string;
}
