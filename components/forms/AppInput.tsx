import React from "react";
import {
    StyleSheet,
    TextInput,
    TextInputProps,
} from "react-native";

import { Theme } from "../../constants/theme";

interface Props extends TextInputProps {}

export default function AppInput(props: Props) {
  return (
    <TextInput
      placeholderTextColor="#999"
      style={styles.input}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: "100%",
    height: 55,

    borderWidth: 1,
    borderColor: "#DDD",

    borderRadius: Theme.radius.lg,

    paddingHorizontal: 18,

    fontSize: Theme.typography.body,

    color: Theme.colors.text,

    backgroundColor: Theme.colors.white,

    marginBottom: 16,
  },
});