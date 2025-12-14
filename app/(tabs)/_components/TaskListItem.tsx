import { View, Text, Image, StyleSheet } from "react-native";
import { StatusIcon } from "./StatusIcon";
import { Task } from "./types";


type Props = {
  task: Task;
};

export const TaskListItem = ({ task }: Props) => {
  return (
    <View style={styles.container}>
      {task.uri && (
        <Image
          source={{ uri: task.uri }}
          style={styles.image}
        />
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{task.name}</Text>
      </View>

      <StatusIcon status={task.status} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
  },
});
