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
import base64 from 'react-native-base64'

import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    StatusBar, PermissionsAndroid,
} from 'react-native';
import {BleError, BleManager, Characteristic, Device} from 'react-native-ble-plx';

import {Colors} from 'react-native/Libraries/NewAppScreen';

declare const global: { HermesInternal: null | {} };
const BLE_BIKE_CONTROL_LOCAL_NAME = "BikeControl"
const BLE_BIKE_SERVICE_UUID = "bdb7d889-18b3-4342-b7d7-e3201e5fa3ef"
const BLE_BIKE_TEMPERATURE_CHARACTERISTIC_UUID = "f71b8d3f-eb1c-495f-9e61-b8a773f2867f"
const BLE_BIKE_HUMIDITY_CHARACTERISTIC_UUID = "8bbb426f-c7a9-4add-8037-68d290fc3875"

const App = () => {
    const [scanCount, setScanCount] = useState(0);
    const [hasLocationPermission, setLocationPermission] = useState(false)
    const bleManager = useRef<BleManager | null>(null)
    const bikeControlDevice = useRef<Device | null>(null)
    const getBikeControlDevice = () => {
        return bikeControlDevice.current
    }
    const getBleManager = () => {
        if (bleManager.current === null) {
            bleManager.current = new BleManager();
        }
        return bleManager.current;
    }
    const monitorTemperature = (error: (BleError | null), characteristic: (Characteristic | null)) => {
        if (error) {
            console.error(error)
            return
        }
        if (!characteristic?.value) {
            console.error("monitor temperature: no data")
            return
        }

        console.log({temperature: parseFloatFromData(characteristic.value)})
    }
    const monitorHumidity = (error: (BleError | null), characteristic: (Characteristic | null)) => {
        if (error) {
            console.error(error)
            return
        }
        if (!characteristic?.value) {
            console.error("monitor humidity: no data")
            return
        }

        console.log({humidity: parseFloatFromData(characteristic.value)})
    }

    const parseFloatFromData = (data: string) => {
        let binary = new ArrayBuffer(4)
        let dataView = new DataView(binary)
        let decoded = base64.decode(data)
        for (let i = 0; i<decoded.length; i++) {
            dataView.setUint8(i, decoded.charCodeAt(i))
        }
        return dataView.getFloat32(0,true).toFixed(2)
    }
    const showFoundDevice = (d: Device) => {
        if (d.localName === BLE_BIKE_CONTROL_LOCAL_NAME) {
            getBleManager().stopDeviceScan();
            d.connect()
                .then((d) => {
                    bikeControlDevice.current = d
                    
                    return d.discoverAllServicesAndCharacteristics()
                })
                .then(d => {
                    d.monitorCharacteristicForService(
                        BLE_BIKE_SERVICE_UUID,
                        BLE_BIKE_TEMPERATURE_CHARACTERISTIC_UUID,
                        monitorTemperature,
                    )
                    d.monitorCharacteristicForService(
                        BLE_BIKE_SERVICE_UUID,
                        BLE_BIKE_HUMIDITY_CHARACTERISTIC_UUID,
                        monitorHumidity,
                    )
                })
        }
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
            let bikeControl = getBikeControlDevice()
            if (bikeControl) {
                bikeControl.cancelConnection()
                    .then((d) => {
                        console.log("disconnected from BikeControl")
                    })
                    .catch(e => {
                        console.error("disconnection from BikeControl failed: ", e)
                    });
            }
            getBleManager().stopDeviceScan()
        }
    }, [getBleManager, scanCount, showFoundDevice, monitorTemperature, hasLocationPermission])
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
