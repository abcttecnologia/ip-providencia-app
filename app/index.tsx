import { Redirect } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { auth } from "../services/firebase";

export default function Index() {
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setAuthenticated(Boolean(user));
        setChecked(true);
      }),
    [],
  );

  if (!checked) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ECE8DD",
        }}
      >
        <ActivityIndicator color="#023411" />
        <Text style={{ marginTop: 12, color: "#546B5F" }}>
          Verificando sua conta...
        </Text>
      </View>
    );
  }

  return (
    <Redirect href={authenticated ? "/(tabs)" : "/welcome"} />
  );
}