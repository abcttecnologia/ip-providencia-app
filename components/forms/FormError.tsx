import { StyleSheet, Text } from "react-native";

export default function FormError({
  message,
}: {
  message?: string;
}) {
  if (!message) return null;

  return (
    <Text style={styles.error}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: {
    color: "#C62828",
    marginBottom: 12,
  },
});