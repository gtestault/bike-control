import {StackNavigationProp} from "@react-navigation/stack";
import {RootStackParamList} from "../../App";
import {SafeAreaView, View, Text, StyleSheet, Dimensions} from "react-native";
import React, {useEffect, useState} from "react";
import {Accelerometer} from 'expo-sensors';
import * as _ from "lodash"
import {Subscription} from "react-native-ble-plx";
import Slider from "@react-native-community/slider";
import CheckBox from "@react-native-community/checkbox";

type TestScreenNavigationProp = StackNavigationProp<RootStackParamList,
    'TestScreen'>;
type Props = {
    navigation: TestScreenNavigationProp
}


type ChartData = { values: number[], time: string[], measurementCount: number }
export const TestScreen = ({navigation}: Props) => {
    const [breaking, setBreaking] = useState(false);
    const [sliderValue, setSliderValue] = useState(5);
    const [checkbox, setCheckbox] = useState(false);
    const [subscription, setSubscription] = useState<Subscription | null>(null);

    const _slow = () => {
        Accelerometer.setUpdateInterval(1000);
    };

    const _fast = () => {
        Accelerometer.setUpdateInterval(16);
    };

    useEffect(() => {
       _fast()
    }, [])

    const _subscribe = () => {
        setSubscription(
            Accelerometer.addListener(accelerometerData => {
                console.log(accelerometerData.y)
                if (checkbox) {
                    if (accelerometerData.y > sliderValue) {
                        setBreaking(true)
                    }
                } else {
                    if (accelerometerData.y < sliderValue) {
                        console.log(true)
                        setBreaking(true)
                    }
                }
            })
        );
    };

    const _unsubscribe = () => {
        subscription && subscription.remove();
        setSubscription(null);
    };

    useEffect(() => {
       if (breaking) {
          let timeout = setTimeout(() => {setBreaking(false)},  3000)
           console.log("disable");
           return () => {clearTimeout(timeout)}
       }
       return
    }, [breaking]);




    useEffect(() => {
        _unsubscribe();
        _subscribe();
        return () => _unsubscribe();
    }, [sliderValue, checkbox]);

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <Slider
                    style={{width: 200, height: 40}}
                    minimumValue={10}
                    maximumValue={-10}
                    minimumTrackTintColor="#FFFFFF"
                    maximumTrackTintColor="#000000"
                    value={sliderValue}
                    onValueChange={(value) => {setSliderValue(value)}}
                />
                <CheckBox
                    disabled={false}
                    value={checkbox}
                    onValueChange={(newValue: boolean) => setCheckbox(newValue)}
                />
                <Text>{sliderValue}</Text>
                <Text style={styles.bigText}>{breaking? "Braking" : ""}</Text>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject
    },
    bigText: {
        fontSize: 60
    }

})
