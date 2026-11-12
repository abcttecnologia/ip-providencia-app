                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";

import { Theme } from "@/constants/theme";

// ─── Animated Button Component ────────────────────────────────────────────────
interface AnimatedButtonProps {
  label: string;
  onPress: () => void;
  style?: any;
  textStyle?: any;
}

function AnimatedButton({ label, onPress, style, textStyle }: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePress = () => {
    handlePressOut();
    onPress();
  };

  return (
    <TouchableWithoutFeedback
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={textStyle}>{label}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(60)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 40,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Decorative top accent */}
      <View style={styles.topAccent} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          },
        ]}
      >
        {/* Logo with glow effect */}
        <Animated.View style={[styles.logoWrapper, { transform: [{ scale: logoScaleAnim }] }]}>
          <View style={styles.logoGlow}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
            />
          </View>
        </Animated.View>

        <Text style={styles.title}>IP Providência</Text>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.subtitle}>
          Deus guia. Deus sustenta. Deus provê.
        </Text>

        <View style={styles.buttonsContainer}>
          {/* Botão Entrar com animação de pressão */}
          <AnimatedButton
            label="Entrar"
            onPress={() => router.push("/login")}
            style={styles.buttonPrimary}
            textStyle={styles.buttonPrimaryText}
          />

          {/* Botão Criar conta (outline) */}
          <TouchableOpacity
            style={styles.buttonSecondary}
            activeOpacity={0.8}
            onPress={() => router.push("/cadastro")}
          >
            <Text style={styles.buttonSecondaryText}>Criar conta</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.visitorContainer}>
          <View style={styles.visitorDivider} />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.visitorText}>
              Continuar como visitante
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },

  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: Theme.colors.primary,
    borderBottomLeftRadius: Theme.radius.full,
    borderBottomRightRadius: Theme.radius.full,
    opacity: 0.04,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 80,
  },

  logoWrapper: {
    marginBottom: Theme.spacing.xl,
  },

  logoGlow: {
    padding: 16,
    borderRadius: 36,
    backgroundColor: Theme.colors.primary,
    opacity: 0.06,
  },

  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    overflow: "hidden",
  },

  title: {
    fontSize: Theme.typography.title,
    fontWeight: "700",
    color: Theme.colors.primary,
    textAlign: "center",
    letterSpacing: -0.5,
  },

  divider: {
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },

  dividerLine: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: Theme.colors.primary,
    opacity: 0.25,
  },

  subtitle: {
    fontSize: Theme.typography.h3,
    fontWeight: "400",
    lineHeight: 28,
    color: Theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: Theme.spacing.xxl,
    fontStyle: "italic",
  },

  buttonsContainer: {
    width: "100%",
    gap: Theme.spacing.md,
  },

  buttonPrimary: {
    width: "100%",
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.xl,
    paddingHorizontal: Theme.spacing.lg,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },

  buttonPrimaryText: {
    color: Theme.colors.white,
    fontSize: Theme.typography.h3,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  buttonSecondary: {
    width: "100%",
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: Theme.radius.xl,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    opacity: 0.85,
  },

  buttonSecondaryText: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.h3,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  visitorContainer: {
    marginTop: Theme.spacing.xl,
    alignItems: "center",
    width: "100%",
  },

  visitorDivider: {
    width: "100%",
    height: 1,
    backgroundColor: Theme.colors.border,
    marginBottom: Theme.spacing.lg,
  },

  visitorText: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.body,
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.7,
  },
});