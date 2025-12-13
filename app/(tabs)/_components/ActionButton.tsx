// import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
//
// const ActionButton = ({
//   label,
//   onPress,
//   danger,
// }: {
//   label: string;
//   onPress: () => void;
//   danger?: boolean;
// }) => (
//   <TouchableOpacity
//     style={[
//       styles.button,
//       danger && { backgroundColor: "#dc2626" },
//     ]}
//     onPress={onPress}
//   >
//     <Text style={styles.buttonText}>{label}</Text>
//   </TouchableOpacity>
// );
//
// const styles = StyleSheet.create({
//   button: {
//     backgroundColor: "#2563eb20",
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderWidth: 1,
//     borderColor: "#2563eb",
//   },
//   buttonText: { color: "white", fontWeight: "600" },
// });
//
// export default ActionButton;


import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp, TouchableOpacityProps } from 'react-native';

interface CustomButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  onPress?: () => void;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
};

export const ActionButton = ({
  children,
  borderColor = '#007AFF',
  ...restProps
}: CustomButtonProps) => {
  return (
    <TouchableOpacity
      hitSlop={10}
      {...restProps}
      onPress={restProps.onPress}
      style={[
        styles.button,
        {
          borderColor,
          backgroundColor: borderColor + "30",
        },
        restProps.style
      ]}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
});
