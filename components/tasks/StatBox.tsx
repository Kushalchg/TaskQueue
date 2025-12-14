import { StyleSheet, Text, View } from "react-native";

const StatBox = ({ label, value }: { label: string; value: number }) => {

  return (
    <View style={dynamicStyles.statBox}>
      <Text style={dynamicStyles.statValue}>{value}</Text>
      <Text style={dynamicStyles.statLabel}>{label}</Text>
    </View>
  );
};

export default StatBox;


const dynamicStyles = StyleSheet.create({
  statBox: {
    width: "30%",
    padding: 12,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
  },
});
