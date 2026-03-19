import { api } from "@/convex/_generated/api";
import { useTheme } from "@/hooks/useTheme";
import { useMutation, useQuery } from "convex/react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const {toggleDarkMode} = useTheme();

  const todos = useQuery(api.todos.getTodos);
  console.log("Total todos;",todos?.length);

  const addTodo = useMutation(api.todos.addTodo);
  const clearAllTodos = useMutation(api.todos.clearAllTodos);

  return (
    <View style={styles.container}>
      <Text style={styles.content}>TORQ</Text>
      <Text>HI</Text>
      <TouchableOpacity onPress={toggleDarkMode}><Text>Toggle the button</Text></TouchableOpacity>

      <TouchableOpacity onPress={() => addTodo({ text:"stay torqued"})}><Text>Add a new todo</Text></TouchableOpacity>
    
      <TouchableOpacity onPress={() => clearAllTodos()}><Text>Clear the todo</Text></TouchableOpacity>
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
