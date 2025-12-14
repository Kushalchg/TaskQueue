import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundTask from "expo-background-task";
import * as Network from "expo-network";
import * as TaskManager from "expo-task-manager";
import { Task } from "../_components/types";
import { uploadImageToServer } from "./uploadService";

export const TASKS_STORAGE_KEY = "backup_tasks";
export const BACKGROUND_TASK_NAME = "backup-images";

export const initializeBackgroundTask = async (
  innnerAppMountedPromise: Promise<void>
) => {
  TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
    try {
      //wait for app to be mounted
      await innnerAppMountedPromise;

      //check network status
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        return BackgroundTask.BackgroundTaskResult.Failed;
      }

      //load tasks from storage
      const tasksJson = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      const tasks: Task[] = tasksJson ? JSON.parse(tasksJson) : [];

      //filter pending tasks
      const pendingTasks = tasks.filter((t) => t.status === "pending");
      if (pendingTasks.length === 0) {
        return BackgroundTask.BackgroundTaskResult.Success;
      }

      //process each pending task
      for (const task of pendingTasks) {
        if (!task.uri) continue;

        //upload image to server
        const success = await uploadImageToServer(task);
        const updatedTasks = tasks.map((t) =>
          t.id === task.id
            ? success
              ? { ...t, status: "completed" as const }
              : { ...t, status: "failed" as const, retries: t.retries + 1 }
            : t
        );

        //store to the asyncstorage
        await AsyncStorage.setItem(
          TASKS_STORAGE_KEY,
          JSON.stringify(updatedTasks)
        );
      }

      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.error("Background task error:", error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });

  await registerBackgroundTask();
};

export const registerBackgroundTask = async () => {
  if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME)) {
    console.log("Background task already registered");
    return;
  }

  try {
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 16, // 16 minutes
    });
    console.log("Background task registered successfully");
  } catch (error) {
    console.error("Error registering background task:", error);
  }
};

export const unregisterBackgroundTask = async () => {
  try {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_NAME);
    console.log("Background task unregistered");
  } catch (error) {
    console.error("Error unregistering background task:", error);
  }
};

export const triggerBackgroundTask = async () => {
  try {
    await unregisterBackgroundTask();
    await registerBackgroundTask();
    console.log("Background task triggered");
  } catch (error) {
    console.error("Error triggering background task:", error);
  }
};

// // Define the background task
// TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
//   try {
//     const networkState = await Network.getNetworkStateAsync();

//     if (!networkState.isConnected) {
//       return BackgroundTask.BackgroundTaskResult.Failed;
//     }

//     const tasksJson = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
//     const tasks: Task[] = tasksJson ? JSON.parse(tasksJson) : [];

//     const pendingTasks = tasks.filter((t) => t.status === "pending");

//     if (pendingTasks.length === 0) {
//       return BackgroundTask.BackgroundTaskResult.Success;
//     }

//     for (const task of pendingTasks) {
//       if (!task.uri) continue;

//       const success = await uploadImageToServer(task);

//       const updatedTasks = tasks.map((t) =>
//         t.id === task.id
//           ? success
//             ? { ...t, status: "completed" as const }
//             : { ...t, status: "failed" as const, retries: t.retries + 1 }
//           : t
//       );

//       //store to the asyncstorage
//       await AsyncStorage.setItem(
//         TASKS_STORAGE_KEY,
//         JSON.stringify(updatedTasks)
//       );
//     }

//     return BackgroundTask.BackgroundTaskResult.Success;
//   } catch (error) {
//     console.error("Background task error:", error);
//     return BackgroundTask.BackgroundTaskResult.Failed;
//   }
// });
