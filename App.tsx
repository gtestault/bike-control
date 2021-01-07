/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useEffect, useRef, useState} from 'react';
import 'react-native-gesture-handler';

import { createStackNavigator } from '@react-navigation/stack';

import {NavigationContainer} from "@react-navigation/native";
import {HomeScreen} from "./src/pages/HomeScreen";
import {SettingsScreen} from "./src/pages/SettingsScreen";
import {NavigationScreen} from "./src/pages/NavigationScreen";

export type RootStackParamList = {
    HomeScreen: undefined
    SettingsScreen: undefined
    NavigationScreen: undefined
}
const Stack = createStackNavigator<RootStackParamList>()
const App = () => {
/*
    useEffect(() => {
        BikeBLE.getInstance().waitForDevice().then((result) => {
            console.log(result)
        }).catch(e => {
            console.error("shutting down")
        })
    }, [])
*/
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="NavigationScreen" options={{headerShown: false}} component={NavigationScreen}/>
                <Stack.Screen name="HomeScreen" options={{headerShown: false}} component={HomeScreen}/>
                <Stack.Screen name="SettingsScreen" options={{headerShown: true, headerTitle: "Einstellungen"}} component={SettingsScreen}/>
            </Stack.Navigator>
        </NavigationContainer>
    );
};


export default App;
