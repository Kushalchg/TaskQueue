import { Ionicons } from "@expo/vector-icons";
import { TaskStatus } from "./types";

type Props = {
  status: TaskStatus;
};

export const StatusIcon = ({ status }: Props) => {
  switch (status) {
    case "completed":
      return (
        <Ionicons
          name="checkmark-circle"
          size={22}
          color="#22c55e" // green
        />
      );

    case "processing":
      return (
        <Ionicons
          name="time-outline"
          size={22}
          color="#f59e0b" // orange
        />
      );

    case "failed":
      return (
        <Ionicons
          name="alert-circle-outline"
          size={22}
          color="#ef4444" // red
        />
      );
    case "pending":
    default:
      return (
        <Ionicons
          name="cloud-upload-outline"
          size={22}
          color="#6b7280" // gray
        />
      );
  }
};
