import React from "react";
import {
    StyleSheet,
    TextInput,
    TextInputProps,
} from "react-native";

import { Theme } from "../../constants/theme";

type Props = TextInputProps;

export default function AppInput(props: Props) {
  const { style, ...inputProps } = props;

  return (
    <TextInput
      placeholderTextColor="#999"
      style={[styles.input, style]}
      {...inputProps}
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