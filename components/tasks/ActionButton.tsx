import React from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

interface CustomButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  onPress?: () => void;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const ActionButton = ({
  children,
  borderColor = "#007AFF",
  disabled = false,
  ...restProps
}: CustomButtonProps) => {
  return (
    <TouchableOpacity
      hitSlop={10}
      disabled={disabled}
      {...restProps}
      onPress={restProps.onPress}
      style={[
        styles.button,
        {
          borderColor: disabled ? "#cbd5e1" : borderColor,
          backgroundColor: disabled ? "#f1f5f9" : borderColor + "30",
        },
        restProps.style,
      ]}
      activeOpacity={disabled ? 1 : 0.7}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
});

export default ActionButton;
