import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import * as Network from "expo-network";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateEvent,
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
  const networkState = Network.useNetworkState();
  const appState = useRef(AppState.currentState);


  //initialize app
  const initializeApp = async () => {
    try {
      const loadedTasks = await loadTasks();
      setTasks(loadedTasks);
      await registerBackgroundTask();
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
    initializeApp();
    //subscribe to the appstate change
    const appStateSubscibe = AppState.addEventListener(
      "change", (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === "active") {
          // App has come to the foreground
          console.log("App has come to the foreground!");
          initializeApp();
          processTasks()
        }

        if (appState.current.match(/active/) && nextAppState === "background") {
          console.log("App has gone to the background!");
        }
        appState.current = nextAppState;

      }
    )

    //remove listner on screen unmount
    return () => {
      appStateSubscibe.remove()
    }

  }, []);

  // Watch network state and trigger background task if online
  useEffect(() => {
    if (networkState.isConnected) {
      triggerBackgroundTask();
    }
  }, [networkState.isConnected]);


  const handleSaveTasks = async (newTasks: Task[]) => {
    await saveTasks(newTasks);
    setTasks(newTasks);
  };

  /* Derived Stats */
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  /* Add Image task */
  const addImageTask = async () => {
    const newImageTasks = await pickImages();

    if (newImageTasks.length === 0) return;

    const updatedTasks = [...tasks, ...newImageTasks];
    await handleSaveTasks(updatedTasks);

    if (networkState.isConnected) {
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
    if (!networkState.isConnected) {
      Alert.alert("Offline", "Connect to the internet first");
      return;
    }

    const pendingTasksList = tasks.filter((t) => t.status != "completed");

    if (pendingTasksList.length === 0) {
      Alert.alert(
        "No pending tasks",
        "All images are already backed up or failed"
      );
      return;
    }

    setIsProcessing(true);

    let updatedTasks = tasks.map((t) =>
      t.status != "completed" ? { ...t, status: "processing" as const } : t
    );
    await handleSaveTasks(updatedTasks);

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
        {/* Status */}
        <View style={styles.statusRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {isProcessing ? (
              <>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={{ color: "#2563eb" }}>Backing up photos...</Text>
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

          {networkState.isConnected ? (
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
