import { Task } from "../_components/types";

const WEBHOOK_URL = "https://webhook.site/1e90b59f-32b4-4860-ad64-fd59c7159701";

export const uploadImageToServer = async (task: Task): Promise<boolean> => {
  if (!task.uri) return false;

  const formData = new FormData();
  formData.append("file", {
    uri: task.uri,
    name: task.name,
    type: "image/jpeg",
  } as any);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Upload error:", error);
    return false;
  }
};
