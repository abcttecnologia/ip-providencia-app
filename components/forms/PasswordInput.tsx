import React, { useState } from "react";
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { Theme } from "@/constants/theme";

export default function PasswordInput(props: any) {
  const [show, setShow] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        secureTextEntry={!show}
        placeholderTextColor="#999"
        style={styles.input}
        {...props}
      />

      <TouchableOpacity
        onPress={() => setShow(!show)}
      >
        <Ionicons
          name={show ? "eye-off" : "eye"}
          size={22}
          color="#666"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",

    alignItems: "center",

    borderWidth: 1,
    borderColor: "#DDD",

    borderRadius: Theme.radius.lg,

    paddingHorizontal: 18,

    height: 55,

    marginBottom: 16,
  },

  input: {
    flex: 1,

    fontSize: Theme.typography.body,

    color: Theme.colors.text,
  },
});