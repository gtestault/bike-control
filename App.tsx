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
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar, PermissionsAndroid,
} from 'react-native';
import {BleManager, Device} from 'react-native-ble-plx';

import {Colors} from 'react-native/Libraries/NewAppScreen';

declare const global: { HermesInternal: null | {} };

const App = () => {
    const [scanCount, setScanCount] = useState(0);
    const [hasLocationPermission, setLocationPermission] = useState(false)
    const bleManager = useRef<BleManager | null>(null)
    const getBleManager = () => {
        if (bleManager.current === null) {
            bleManager.current = new BleManager();
        }
        return bleManager.current;
    }
    const showFoundDevice = (d: Device) => {
        console.log("found device, ", d.serviceUUIDs)
    }
    useEffect(() => {
       requestLocationPermission()
    }, [])

    const requestLocationPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                "android.permission.ACCESS_FINE_LOCATION",
                {
                    title: "Location permision for bluetooth LE",
                    message:
                        "Bike Control App needs access to your location " +
                        "for BLE connection to sensors.",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log("You can use the location");
                setLocationPermission(true)
                return true
            } else {
                console.log("location permission denied");
                return false
            }
        } catch (err) {
            console.warn(err);
        }
    };

    useEffect(() => {
        if (!hasLocationPermission) return;
        console.log("runnig ble scan")
        getBleManager().startDeviceScan(
            null,
            null,
            (error, scannedDevice) => {
                if (error != null || scannedDevice == null) {
                    console.log(error || "device is null")
                    return
                }
                showFoundDevice(scannedDevice)
            }
        )
        return function cleanup() {
            console.log("stopping ble scan")
            getBleManager().stopDeviceScan()
        }
    }, [getBleManager, scanCount, showFoundDevice, hasLocationPermission])
    return (
        <>
            <StatusBar barStyle="dark-content"/>
            <SafeAreaView>
                <ScrollView
                    contentInsetAdjustmentBehavior="automatic"
                    style={styles.scrollView}>
                    <View>
                        <Text style={styles.title}>Bike Control</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        backgroundColor: Colors.lighter,
    },
    title: {
        fontSize: 36,
        textAlign: "center",
    },
});

export default App;
