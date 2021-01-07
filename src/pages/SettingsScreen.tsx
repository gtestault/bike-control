import React, {useState} from "react";
import {Button, SafeAreaView, StyleSheet, Switch, Text, View} from "react-native";
import {settingsIntroDescription, settingsIntroDescription2, settingsIntroTitle} from "../text/deutsch";
import {StackNavigationProp} from "@react-navigation/stack";
import {RootStackParamList} from "../../App";

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList,
    'SettingsScreen'>;
type Props = {
    navigation: SettingsScreenNavigationProp
}
export const SettingsScreen = ({navigation}: Props) => {
    const [isFrontDangerRecognitionEnabled, setIsFrontDangerRecognitionEnabled] = useState(true);
    const toggleFrontDangerRecognitionEnabled = () => setIsFrontDangerRecognitionEnabled(previousState => !previousState);
    const [isSideDangerRecognitionEnabled, setIsSideDangerRecognitionEnabled] = useState(true);
    const toggleSideDangerRecognitionEnabled = () => setIsSideDangerRecognitionEnabled(previousState => !previousState);
    const [isAdaptiveLightEnabled, setIsAdaptiveLightEnabled] = useState(true);
    const toggleAdaptiveLightEnabledEnabled = () => setIsAdaptiveLightEnabled(previousState => !previousState);
    return (
        <SafeAreaView>
            <View
                style={styles.mainView}>
                <View style={styles.settingsContainer}>
                    <Text style={styles.introTitle}>{settingsIntroTitle}</Text>
                    <View style={styles.introDescriptionContainer}>
                        <Text style={styles.settingsIntroDescription}>{settingsIntroDescription}</Text>
                        <Text style={{
                            ...styles.settingsIntroDescription,
                            marginTop: 10
                        }}>{settingsIntroDescription2}</Text>
                    </View>
                    <View style={styles.settingsSection}>
                        <View style={styles.individualFeatureToggleContainer}>
                            <Text>Gefahrenerkennung nach vorne</Text>
                            <Switch value={isFrontDangerRecognitionEnabled}
                                    onValueChange={toggleFrontDangerRecognitionEnabled}/>
                        </View>
                        <View style={styles.individualFeatureToggleContainer}>
                            <Text>Seitliche Abstandslichter</Text>
                            <Switch value={isSideDangerRecognitionEnabled}
                                    onValueChange={toggleSideDangerRecognitionEnabled}/>
                        </View>
                        <View style={{...styles.individualFeatureToggleContainer, borderBottomWidth: 1}}>
                            <Text>Adaptives Bremslicht nach hinten</Text>
                            <Switch value={isAdaptiveLightEnabled}
                                    onValueChange={toggleAdaptiveLightEnabledEnabled}/>
                        </View>
                    </View>
                    <View style={styles.nextButton}>
                        <Button color={"#343A40"} title="Weiter" onPress={() => {
                            navigation.navigate("NavigationScreen")
                        }}/>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
};
const styles = StyleSheet.create({
    mainView: {
        height: "100%"
    },
    nextButton: {
        alignSelf: "center",
        marginTop: 40,
        width: "40%",
    },
    settingsIntroDescription: {
        fontFamily: "Roboto-Light",
        fontSize: 16
    },
    individualFeatureToggleContainer: {
        paddingTop: 5,
        paddingBottom: 5,
        marginLeft: -20,
        paddingLeft: 20,
        borderTopWidth: 1,
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center"
    },
    settingsSection: {
        marginTop: 30
    },
    settingsContainer: {
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        margin: 20,
        flex: 1,
    },
    introDescriptionContainer: {},
    introTitle: {
        fontSize: 24,
        fontFamily: "Roboto-Medium",
        textAlign: "center",
    },
});
