import { ColorScheme, useTheme } from "@/hooks/useTheme";
import { useMutation, useQuery } from "convex/react";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import { createHomeStyles } from "@/assets/styles/home.styles";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import  Header  from "@/components/Header";
import TodoInput from "@/components/TodoInput";

export default function Index() {
  const {toggleDarkMode, colors} = useTheme();

  const homeStyles = createHomeStyles(colors);

  return (
    <LinearGradient colors={colors.gradients.background} style={homeStyles.container}>
    <StatusBar barStyle={colors.statusBarStyle} />
    <SafeAreaView style={homeStyles.safeArea}>
      <Header />
      <TodoInput />
      <TouchableOpacity onPress={toggleDarkMode}><Text>Toggle the button</Text></TouchableOpacity>

      {/*<TouchableOpacity onPress={() => addTodo({ text:"stay torqued"})}><Text>Add a new todo</Text></TouchableOpacity>
    
      <TouchableOpacity onPress={() => clearAllTodos()}><Text>Clear the todo</Text></TouchableOpacity> */}
    </SafeAreaView>
    </LinearGradient>
  );
}


