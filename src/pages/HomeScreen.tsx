import React from "react";
import {Button, SafeAreaView, StyleSheet, Text, View} from "react-native";
import { StackNavigationProp } from '@react-navigation/stack';
import {RootStackParamList} from "../../App";


type HomeScreenNavigationProp = StackNavigationProp<
     RootStackParamList,
    'HomeScreen'
    >;
type Props = {
    navigation: HomeScreenNavigationProp
}
export const HomeScreen = ({navigation}: Props) => {
    return (
        <SafeAreaView>
            <View
                style={styles.scrollView}>
                <View style={styles.welcomeContainer}>
                    <Text style={styles.welcomeText}>Wilkommen zu</Text>
                    <Text style={styles.title}>BIKIT</Text>
                    <View style={styles.startButton}>
                        <Button color={"#343A40"} title="Starten" onPress={() => {
                            navigation.navigate("SettingsScreen")
                        }}/>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
};
const styles = StyleSheet.create({
    scrollView: {
        height: "100%"
    },
    startButton: {
        marginTop: 30,
        width: "40%",
    },
    welcomeContainer: {
        marginTop: -100,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
    },
    welcomeText: {
        fontFamily: "Roboto-Regular",
        fontSize: 18,
    },
    title: {
        fontSize: 49,
        fontFamily: "Roboto-Bold",
        textAlign: "center",
    },
});
