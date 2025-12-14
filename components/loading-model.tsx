
import React from "react";
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

type ImageCopyLoaderProps = {
  visible: boolean;
};

const LoadingModel: React.FC<ImageCopyLoaderProps> = ({
  visible,
}) => {
  return (
    <Modal
      transparent
      statusBarTranslucent
      animationType="fade"
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={"#ffaa00"} />

          <Text style={styles.message}>
            Copying image into app storage…
          </Text>

        </View>
      </View>
    </Modal>
  );
};

export default LoadingModel;


const colors = {
  primary: "#2563EB", // blue-600
  text: "#111827",    // gray-900
  cancel: "#DC2626",  // red-600
  backdrop: "rgba(0,0,0,0.4)",
  surface: "#FFFFFF",
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    padding: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    fontFamily: "GroteskBold",
    textAlign: "center",
  },
  cancel: {
    marginTop: 20,
    fontSize: 16,
    color: colors.cancel,
    fontFamily: "GroteskBold",
  },
});
