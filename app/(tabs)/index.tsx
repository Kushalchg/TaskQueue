import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import * as Network from "expo-network";
import StatusBadge from "./_components/StatsBadge";
import StatBox from "./_components/StatBox";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import { ActionButton } from "./_components/ActionButton";

type TaskStatus = "pending" | "processing" | "failed" | "completed";

interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  retries: number;
}

export default function TaskDashboardScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const networkState = Network.useNetworkState()


  /* ---------------- Derived Stats ---------------- */
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const failedTasks = tasks.filter(t => t.status === "failed").length;

  /* ---------------- Actions ---------------- */
  const addTask = () => {
    const generateTaskId = () =>
      `task_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    setTasks(prev => [
      ...prev,
      {
        id: generateTaskId(),
        name: `Task ${prev.length + 1}`,
        status: "pending",
        retries: 0,
      },
    ]);
  };

  const clearTasks = () => {
    Alert.alert("Clear Tasks", "Remove all tasks?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setTasks([]),
      },
    ]);
  };

  const processTasks = async () => {
    if (!networkState.isConnected) {
      Alert.alert("Offline", "Connect to the internet first");
      return;
    }

    setIsProcessing(true);

    setTasks(prev =>
      prev.map(t =>
        t.status === "pending" ? { ...t, status: "processing" } : t
      )
    );

    // Simulated processing
    setTimeout(() => {
      setTasks(prev =>
        prev.map(t =>
          t.status === "processing"
            ? Math.random() > 0.2
              ? { ...t, status: "completed" }
              : { ...t, status: "failed", retries: t.retries + 1 }
            : t
        )
      );
      setIsProcessing(false);
    }, 2000);
  };

  /* ---------------- Render ---------------- */
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>

        {/* Status */}
        <View style={styles.statusRow}>
          {networkState.isConnected ?
            <Icon name="wifi-strength-4" size={25} color={"#00aa44"} /> :
            <Icon name="wifi-strength-alert-outline" size={25} color={"#aa0044"} />
          }
          <StatusBadge
            label={isProcessing ? "Processing…" : "Idle"}
            color={isProcessing ? "#2563eb" : "#6b7280"}
          />
        </View>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="Total" value={totalTasks} />
          <StatBox label="Pending" value={pendingTasks} />
          <StatBox label="Failed" value={failedTasks} />
        </View>


        {/* Controls */}
        <View style={styles.controls}>
          <ActionButton onPress={addTask}>
            <Icon name="plus" size={16} color="#2563eb" style={{ marginRight: 6 }} />
            <Text style={{ color: "#2563eb" }}>Upload</Text>
          </ActionButton>

          <ActionButton onPress={processTasks}>
            <Icon name="cog-play" size={16} color="#2563eb" style={{ marginRight: 6 }} />
            <Text style={{ color: "#2563eb" }}>Process</Text>
          </ActionButton>

          <ActionButton onPress={clearTasks} borderColor="#dc2626">
            <Icon name="trash-can-outline" size={16} color="#dc2626" style={{ marginRight: 6 }} />
            <Text style={{ color: "#dc2626" }}>Clear</Text>
          </ActionButton>
        </View>

        {/* Task List */}
        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tasks added</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.taskItem}>
              <Text style={styles.taskName}>{item.name}</Text>
              <Text style={styles.taskStatus}>{item.status}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}


/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginVertical: 12,
  },

  statusRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 12,
  },

  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  taskItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  taskName: { fontWeight: "500" },
  taskStatus: { textTransform: "capitalize", color: "#475569" },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#94a3b8",
  },
});
