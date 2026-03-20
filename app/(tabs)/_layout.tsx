import { Tabs } from 'expo-router'
import { useTheme } from "@/hooks/useTheme"
import { Ionicons } from '@expo/vector-icons'

const TabsLayout = () => {
    const {colors} = useTheme();
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor:"aqua",
            tabBarInactiveTintColor:"#450364",
            tabBarStyle:{
                backgroundColor:colors.border,
                borderTopWidth:1,
                borderTopColor:"white",
                height:90,
                paddingBottom:30,
                paddingTop:10,
            },
            tabBarLabelStyle:{
                fontSize:15,
                fontWeight:"600",
            },
            headerShown:false,
        }}>  
            <Tabs.Screen name='index' options={{title:"Blocks", tabBarIcon: ({color,size}) => (  // index is used here as index file is there
                <Ionicons name="flash-outline" size={size} color={color} />  
            )}}/>

        <Tabs.Screen name='settings' options={{title:"Settings", tabBarIcon: ({color,size}) => (  // settings is used as settings file is there
                <Ionicons name="settings" size={size} color={color} />
            )}}/>

        </Tabs>
    )
}
export default TabsLayout