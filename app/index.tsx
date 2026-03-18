import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.content}>Torq</Text>
      <Text>TORQ</Text>
      <Link href="/about">Hello</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "blue",
    gap: 10,
  },
  content: {
    fontSize: 19,
  },
});
