import {BleError, BleManager, Characteristic, Device} from 'react-native-ble-plx';
import base64 from "react-native-base64";
import {PermissionsAndroid} from "react-native";

const BLE_BIKE_CONTROL_LOCAL_NAME = "BikeControl"
const BLE_BIKE_SERVICE_UUID = "bdb7d889-18b3-4342-b7d7-e3201e5fa3ef"
const BLE_BIKE_TEMPERATURE_CHARACTERISTIC_UUID = "f71b8d3f-eb1c-495f-9e61-b8a773f2867f"
const BLE_BIKE_HUMIDITY_CHARACTERISTIC_UUID = "8bbb426f-c7a9-4add-8037-68d290fc3875"
type PromiseBoolResolve = (value?: (boolean | PromiseLike<boolean> | undefined)) => void

export class BikeBLE {
    private static instance: BikeBLE | null = null
    private connectedToDevice = false
    private hasLocationPermission = false

    private ble: BleManager
    private device: Device | null = null

    private constructor() {
        this.ble = new BleManager()
    }

    async waitForDevice(): Promise<boolean> {
        let result = new Promise<boolean>((resolve, reject) => {
            if (this.connectedToDevice) {
                return resolve(true)
            }
            this.requestLocationPermission()
                .then(() => {
                    BikeBLE.log("successfully got location permission")
                    BikeBLE.log("starting device scan: searching for Bike BLE device")
                    this.ble.startDeviceScan(
                        null,
                        null,
                        (error, scannedDevice) => {
                            if (error != null || scannedDevice == null) {
                                console.log("start scan error", error?.message)
                                console.log(error || "device is null")
                                return
                            }
                            this.findDevice(scannedDevice, resolve)
                        })
                })
                .catch((e) => {
                    BikeBLE.error("failed to get required permission: " + e)
                })
        })
        let timeout = new Promise<boolean>((resolve, reject) => {
            setTimeout(() => {
                reject("timeout")
                this.ble.stopDeviceScan()
            }, 8000)
        })
        return Promise.race([result, timeout])
    }

    private static log(message: any) {
        console.log("BleManager: ", message)
    }

    private static error(message: any) {
        console.error("BleManager: ", message)
    }

    requestLocationPermission = async () => {
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
            this.hasLocationPermission = true
            return true
        } else {
            console.log("location permission denied");
            return false
        }
    };

    public destroyConnection() {
        this.device?.cancelConnection()
            .then((d) => {
                BikeBLE.log("destroyed BLE connection")
            })
            .catch((e) => {
                BikeBLE.log("failed to destroy BLE connection: " + e)
            })
    }


    private findDevice(d: Device, resolve: PromiseBoolResolve) {
        if (d.localName === BLE_BIKE_CONTROL_LOCAL_NAME) {
            this.ble.stopDeviceScan();
            d.connect()
                .then((d) => {
                    this.device = d
                    this.connectedToDevice = true
                    return d.discoverAllServicesAndCharacteristics()
                })
                .then(d => {
                    d.monitorCharacteristicForService(
                        BLE_BIKE_SERVICE_UUID,
                        BLE_BIKE_TEMPERATURE_CHARACTERISTIC_UUID,
                        this.monitorTemperature,
                    )
                    d.monitorCharacteristicForService(
                        BLE_BIKE_SERVICE_UUID,
                        BLE_BIKE_HUMIDITY_CHARACTERISTIC_UUID,
                        this.monitorHumidity,
                    )
                    resolve(true)
                })
        }
    }

    parseFloatFromData = (data: string) => {
        let binary = new ArrayBuffer(4)
        let dataView = new DataView(binary)
        let decoded = base64.decode(data)
        for (let i = 0; i < decoded.length; i++) {
            dataView.setUint8(i, decoded.charCodeAt(i))
        }
        return dataView.getFloat32(0, true).toFixed(2)
    }
    monitorTemperature = (error: (BleError | null), characteristic: (Characteristic | null)) => {
        if (error) {
            BikeBLE.error(error)
            return
        }
        if (!characteristic?.value) {
            BikeBLE.error("monitor temperature: no data")
            return
        }

        BikeBLE.log({temperature: this.parseFloatFromData(characteristic.value)})
    }
    monitorHumidity = (error: (BleError | null), characteristic: (Characteristic | null)) => {
        if (error) {
            BikeBLE.error(error)
            return
        }
        if (!characteristic?.value) {
            BikeBLE.error("monitor humidity: no data")
            return
        }

        BikeBLE.log({humidity: this.parseFloatFromData(characteristic.value)})
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new BikeBLE()
        }
        return this.instance
    }


}

export default BikeBLE

