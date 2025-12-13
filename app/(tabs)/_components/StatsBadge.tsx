import { StyleSheet, Text, View } from "react-native";

const StatusBadge = ({ label, color }: { label: string; color: string }) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <Text style={styles.badgeText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: "white", fontWeight: "600" },
});

export default StatusBadge;
