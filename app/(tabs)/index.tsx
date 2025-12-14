import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import * as Network from "expo-network";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionButton from "./_components/ActionButton";
import StatBox from "./_components/StatBox";
import { TaskListItem } from "./_components/TaskListItem";
import { Task } from "./_components/types";
import {
  initializeBackgroundTask,
  registerBackgroundTask,
  triggerBackgroundTask,
} from "./_services/backgroundTaskService";
import { pickImages } from "./_services/imageService";
import {
  clearAllTasks,
  loadTasks,
  saveTasks,
} from "./_services/storageService";
import { uploadImageToServer } from "./_services/uploadService";
import LoadingModel from "@/components/loading-model";

// Declare a variable to store the resolver function
let resolver: (() => void) | null;
// Create a promise and store its resolve function for later
const promise = new Promise<void>((resolve) => {
  resolver = resolve;
});
//initialize the backgorund task
initializeBackgroundTask(promise);

export default function TaskDashboardScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { isConnected } = Network.useNetworkState();
  const appState = useRef(AppState.currentState);

  console.log({ tasks })

  //initialize app
  const initializeApp = async () => {
    try {
      const loadedTasks = await loadTasks();
      setTasks(loadedTasks);
      await registerBackgroundTask();
      return loadedTasks;
    } catch (error) {
      console.error("Error initializing app:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load tasks from AsyncStorage and register background Task if not registered alredy  on mount
  useEffect(() => {
    if (resolver) {
      resolver();
      console.log("Resolver called");
    }
    // await initialization so that other foreground logic can rely on stored tasks
    initializeApp();
    //subscribe to the appstate change
    const appStateSubscibe = AppState.addEventListener(
      "change",
      async (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // App has come to the foreground
          console.log("App has come to the foreground!");
          // Ensure we load the latest tasks from storage then process them
          await initializeApp();
          processTasks();
        }

        if (appState.current.match(/active/) && nextAppState === "background") {
          console.log("App has gone to the background!");
        }
        appState.current = nextAppState;
      }
    );

    //remove listner on screen unmount
    return () => {
      appStateSubscibe.remove();
    };
  }, []);

  // Watch network state and trigger backup sync task if online
  useEffect(() => {
    // If device becomes online and the app is in foreground, process immediately.
    if (isConnected) {
      if (appState.current === "active") {
        processTasks();
      } else {
        // If in background, trigger background-processing cycle
        triggerBackgroundTask();
      }
    }
  }, [isConnected]);

  const handleSaveTasks = async (newTasks: Task[]) => {
    await saveTasks(newTasks);
    setTasks(newTasks);
  };

  /* Derived Stats */
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const failedTasks = tasks.filter((t) => t.status === "failed").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  /* Add Image task */
  const addImageTask = async () => {
    setIsUploading(true);
    const newImageTasks = await pickImages();
    if (newImageTasks.length === 0) return;

    const updatedTasks = [...tasks, ...newImageTasks];
    await handleSaveTasks(updatedTasks);
    setIsUploading(false);

    // If online and app is active, process immediately; otherwise trigger background processing
    try {
      const net = await Network.getNetworkStateAsync();
      if (net.isConnected) {
        if (appState.current === "active") {
          processTasks();
        } else {
          triggerBackgroundTask();
        }
      }
    } catch (e) {
      // fallback: trigger background task
      triggerBackgroundTask();
    }
  };

  /* Clear Tasks */
  const clearTasks = () => {
    Alert.alert("Clear Tasks", "Remove all tasks?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await clearAllTasks();
          setTasks([]);
        },
      },
    ]);
  };

  /* Process Tasks (Manual backup) */
  const processTasks = async () => {
    // Check network connectivity live to avoid stale hook values
    try {
      const netState = await Network.getNetworkStateAsync();
      if (!netState.isConnected) {
        Alert.alert("Offline", "Connect to the internet first");
        return;
      }
    } catch (e) {
      Alert.alert("Network Error", "Unable to check network status");
      return;
    }

    // Always load latest tasks from storage to avoid using stale state
    const storedTasks = await loadTasks();
    const pendingTasksList = storedTasks.filter(
      (t) => t.status !== "completed"
    );

    if (pendingTasksList.length === 0) {
      // update state with stored tasks in case they changed elsewhere
      setTasks(storedTasks);
      Alert.alert(
        "No pending tasks",
        "All images are already backed up or failed"
      );
      return;
    }

    setIsProcessing(true);
    let updatedTasks = storedTasks.map((t) =>
      t.status !== "completed" ? { ...t, status: "processing" as const } : t
    );
    //update the state and storage
    await handleSaveTasks(updatedTasks);
    setTasks(updatedTasks);

    for (const task of pendingTasksList) {
      const success = await uploadImageToServer(task);
      updatedTasks = updatedTasks.map((t) =>
        t.id === task.id
          ? success
            ? { ...t, status: "completed" as const }
            : { ...t, status: "failed" as const, retries: t.retries + 1 }
          : t
      );
      await handleSaveTasks(updatedTasks);
      setTasks(updatedTasks);
    }

    setIsProcessing(false);
    Alert.alert("Done", "Image upload completed");
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>

      <View style={styles.container}>
        {isUploading ? (
          <LoadingModel visible={isUploading} />
        ) : null}
        {/* Status */}
        <View style={styles.statusRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {isProcessing ? (
              <>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={{ color: "#2563eb" }}>Backing up photos...</Text>
              </>
            ) : failedTasks != 0 ? (
              <>
                <Icon name="alert-circle-outline" size={25} color={"#ef4444"} />
                <Text style={{ color: "#ef4444" }}>
                  {failedTasks} photos failed, {pendingTasks} pending
                </Text>
              </>

            ) : pendingTasks === 0 ? (
              <>
                <Icon name="check-circle-outline" size={25} color={"#00aa44"} />
                <Text style={{ color: "#00aa44" }}>
                  All photos are backed up
                </Text>
              </>
            ) : (
              <>
                <Icon name="alert-circle-outline" size={25} color={"#f59e0b"} />
                <Text style={{ color: "#f59e0b" }}>
                  {pendingTasks} photos pending
                </Text>
              </>
            )}
          </View>

          {isConnected ? (
            <Icon name="wifi-strength-4" size={25} color={"#00aa44"} />
          ) : (
            <Icon
              name="wifi-strength-alert-outline"
              size={25}
              color={"#aa0044"}
            />
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="Total" value={totalTasks} />
          <StatBox label="Pending" value={pendingTasks} />
          <StatBox label="Backed up" value={completedTasks} />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <ActionButton onPress={addImageTask}>
            <Icon
              name="plus"
              size={16}
              color="#2563eb"
              style={{ marginRight: 6 }}
            />
            <Text style={{ color: "#2563eb" }}>Add Photos</Text>
          </ActionButton>

          <ActionButton
            onPress={processTasks}
            disabled={isProcessing || pendingTasks === 0}
          >
            <Icon
              name="cloud-upload"
              size={16}
              color="#2563eb"
              style={{ marginRight: 6 }}
            />
            <Text style={{ color: "#2563eb" }}>Backup</Text>
          </ActionButton>

          <ActionButton onPress={clearTasks} borderColor="#dc2626">
            <Icon
              name="trash-can-outline"
              size={16}
              color="#dc2626"
              style={{ marginRight: 6 }}
            />
            <Text style={{ color: "#dc2626" }}>Clear</Text>
          </ActionButton>
        </View>

        {/* Task List */}
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No images added</Text>
          }
          renderItem={({ item }) => <TaskListItem task={item} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginVertical: 12,
  },
  statusRow: {
    justifyContent: "space-between",
    flexDirection: "row",
    gap: 10,
    marginVertical: 12,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#94a3b8",
  },
});
