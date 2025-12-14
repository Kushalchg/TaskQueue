import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import * as Network from "expo-network";
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import StatBox from "./_components/StatBox";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "@expo/vector-icons/MaterialCommunityIcons";
import ActionButton from "./_components/ActionButton";
import { TaskListItem } from "./_components/TaskListItem";
import { Task } from "./_components/types";


export default function TaskDashboardScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const networkState = Network.useNetworkState()


  /* ---------------- Derived Stats ---------------- */
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const failedTasks = tasks.filter(t => t.status === "failed").length;


  /* ---------------- Add Image task---------------- */
  const addImageTask = async () => {
    // Ask permission first
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert("Permission to access photos is required!");
      return;
    }

    // Pick images (multiple selection enabled)
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (pickerResult.canceled || !pickerResult.assets.length) return;

    for (const asset of pickerResult.assets) {
      const pickedUri = asset.uri;
      const fileName = pickedUri.split('/').pop();

      if (!fileName) continue;

      try {
        // Create a File instance for the source
        const sourceFile = new File(pickedUri);
        // Create a File instance for the destination in the document directory
        const destinationFile = new File(Paths.document, fileName);
        // Copy the file
        sourceFile.copy(destinationFile);

        // Add task immediately after processing
        setTasks(prev => [...prev, {
          id: `task_${Date.now()}_${Math.random()}`,
          name: fileName,
          status: 'pending',
          retries: 0,
          uri: destinationFile.uri,
        }]);

      } catch (e) {
        console.error(`Error saving image ${fileName}:`, e);
        Alert.alert("Error", `Failed to save ${fileName}`);
      }
    }

  };

  /* ---------------- Clear Tasks ---------------- */
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

  //takd the image url from tasks and upload to the server with endpoint
  //'https://example.com/upload'

  const uploadImage = async (task: Task) => {
    if (!task.uri) return false;
    const formData = new FormData();
    formData.append('file', {
      uri: task.uri,
      name: task.name,
      type: 'image/jpeg',
    } as any);

    try {
      const response = await fetch('https://webhook.site/1e90b59f-32b4-4860-ad64-fd59c7159701', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Upload error:', error);
      return false;
    }
  };

  /* ---------------- Process Tasks ---------------- */
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

    //upload to the server one by one endpint::https://webhook.site/1e90b59f-32b4-4860-ad64-fd59c7159701
    for (const task of tasks) {
      if (task.status === "pending") {
        const success = await uploadImage(task);
        setTasks(prev =>
          prev.map(t =>
            t.id === task.id
              ? success
                ? { ...t, status: "completed" }
                : { ...t, status: "failed", retries: t.retries + 1 }
              : t
          )
        );
      }
    }

    setIsProcessing(false);
  };


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
            ) : (
              <>
                <Icon name="check-circle-outline" size={25} color={"#00aa44"} />
                <Text style={{ color: "#00aa44" }}>All photos are backed up</Text>
              </>
            )}
          </View>

          {networkState.isConnected ?
            <Icon name="wifi-strength-4" size={25} color={"#00aa44"} /> :
            <Icon name="wifi-strength-alert-outline" size={25} color={"#aa0044"} />
          }
        </View>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox label="Total" value={totalTasks} />
          <StatBox label="Pending" value={pendingTasks} />
          <StatBox label="Failed" value={failedTasks} />
        </View>


        {/* Controls */}
        <View style={styles.controls}>
          <ActionButton onPress={addImageTask}>
            <Icon name="plus" size={16} color="#2563eb" style={{ marginRight: 6 }} />
            <Text style={{ color: "#2563eb" }}>Add Photos</Text>
          </ActionButton>

          <ActionButton onPress={processTasks}>
            <Icon name="cloud-upload" size={16} color="#2563eb" style={{ marginRight: 6 }} />
            <Text style={{ color: "#2563eb" }}>Backup</Text>
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
          ListEmptyComponent={<Text style={styles.emptyText}>No images added</Text>}
          renderItem={({ item }) => (
            <TaskListItem task={item} />
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
