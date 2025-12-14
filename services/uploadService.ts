import { Task } from "@/components/tasks/types";

const WEBHOOK_URL = "https://webhook.site/8c411855-103d-4ffd-9c76-373192e644c9";

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

    console.log("upload Successful", { response });
    return response.ok;
  } catch (error) {
    console.error("Upload error:", error);
    return false;
  }
};
