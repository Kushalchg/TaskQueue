
import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp, TouchableOpacityProps } from 'react-native';

interface CustomButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  onPress?: () => void;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
};

const ActionButton = ({
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

export default ActionButton;
