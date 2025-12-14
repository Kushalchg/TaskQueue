import { Task } from "@/components/tasks/types";
import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export const pickImages = async (): Promise<Task[]> => {
  const permissionResult =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    Alert.alert(
      "Permission Required",
      "Permission to access photos is required!"
    );
    return [];
  }

  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    allowsMultipleSelection: true,
    mediaTypes: ["images"],
    quality: 0.7,
  });

  if (pickerResult.canceled || !pickerResult.assets.length) {
    return [];
  }

  const newTasks: Task[] = [];

  for (const asset of pickerResult.assets) {
    const pickedUri = asset.uri;
    const fileName = pickedUri.split("/").pop();

    if (!fileName) continue;

    try {
      const sourceFile = new File(pickedUri);
      const destinationFile = new File(Paths.document, fileName);
      sourceFile.copy(destinationFile);

      newTasks.push({
        id: `task_${Date.now()}_${Math.random()}`,
        name: fileName,
        status: "pending",
        retries: 0,
        uri: destinationFile.uri,
      });
    } catch (e) {
      console.error(`Error saving image ${fileName}:`, e);
      Alert.alert("Error", `Failed to save ${fileName}`);
    }
  }

  return newTasks;
};
