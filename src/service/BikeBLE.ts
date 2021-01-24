import {BleError, BleManager, Characteristic, Device} from 'react-native-ble-plx';
import base64 from "react-native-base64";
import {PermissionsAndroid} from "react-native";

const BLE_BIKE_CONTROL_LOCAL_NAME = "BikeControl"
const BLE_BIKE_SERVICE_UUID = "bdb7d889-18b3-4342-b7d7-e3201e5fa3ef"
const BLE_BIKE_TEMPERATURE_CHARACTERISTIC_UUID = "f71b8d3f-eb1c-495f-9e61-b8a773f2867f"
const BLE_BIKE_HUMIDITY_CHARACTERISTIC_UUID = "8bbb426f-c7a9-4add-8037-68d290fc3875"
type PromiseBoolResolve = (value?: (boolean | PromiseLike<boolean> | undefined)) => void
export type TemperatureListener = (temperature: string) => void
export type HumidityListener = (humidity: string) => void
export type DistanceLeftListener = (distanceLeft: number) => void

export class BikeBLE {
    private static instance: BikeBLE | null = null
    private connectedToDevice = false
    private hasLocationPermission = false
    private temperatureListeners: TemperatureListener[] = []
    private humidityListeners: HumidityListener[] = []
    private distanceLeftListeners: DistanceLeftListener[] = []

    private ble: BleManager
    private device: Device | null = null

    private constructor() {
        this.ble = new BleManager()
    }

    subscribeTemperature(listener: TemperatureListener) {
        this.temperatureListeners.push(listener)
    }

    subscribeHumidity(listener: HumidityListener) {
        this.humidityListeners.push(listener)
    }

    subscribeDistanceLeft(listener: DistanceLeftListener) {
        this.distanceLeftListeners.push(listener)
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
                            this.findDevice(scannedDevice, resolve, reject)
                        })
                })
                .catch((e) => {
                    BikeBLE.error("failed to get required permission: " + e)
                    this.ble.stopDeviceScan()
                    BikeBLE.log("stopped device scan")
                })
        })
        let timeout = new Promise<boolean>((resolve, reject) => {
            setTimeout(() => {
                reject("timeout")
                this.ble.stopDeviceScan()
            }, 20000)
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

    public isConnected() {
        return this.connectedToDevice
    }


    private findDevice(d: Device, resolve: PromiseBoolResolve, reject: any) {
        if (d.localName === BLE_BIKE_CONTROL_LOCAL_NAME) {
            BikeBLE.log("found bike device with id: " + d.id)
            this.ble.stopDeviceScan();
            BikeBLE.log("attempting connection to: " + d.id)
            d.connect({refreshGatt: "OnConnected"})
                .then((d) => {
                    BikeBLE.log("connected to device:" + d.id)
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
                .catch((e) => {
                    BikeBLE.error("connection to device failed: " + e)
                    console.log(JSON.stringify(e, null, 4));
                    reject(e)
                })

        }
    }

    public writeBraking = (braking: boolean) => {
        if (!this.device) {
            BikeBLE.error("no device found");
            return
        }
        let binary = new ArrayBuffer(4)
        let dataView = new DataView(binary)
        if (braking) {
            dataView.setUint32(0, 1, true)
        } else {
            dataView.setUint32(0, 0, true)
        }
        let data = _arrayBufferToBase64(dataView.buffer)
        console.log(data)
        this.device.writeCharacteristicWithResponseForService(
            "bdb7d889-18b3-4342-b7d7-e3201e5fa3ef",
            "c2b4e981-089a-4a09-8241-0a73783ae4f5",
            data,
        )
            .then(() => {BikeBLE.log("braking ble write success")})
            .catch((e) => {BikeBLE.error("braking ble write fail: " + e)})
        return
    }

    parseFloatFromData = (data: string): string => {
        let binary = new ArrayBuffer(4)
        let dataView = new DataView(binary)
        let decoded = base64.decode(data)
        for (let i = 0; i < decoded.length; i++) {
            dataView.setUint8(i, decoded.charCodeAt(i))
        }
        return dataView.getFloat32(0, true).toFixed(2)
    }
    parseDoubleFromData = (data: string): number => {
        let binary = new ArrayBuffer(8)
        let dataView = new DataView(binary)
        let decoded = base64.decode(data)
        for (let i = 0; i < decoded.length; i++) {
            dataView.setUint8(i, decoded.charCodeAt(i))
        }
        return dataView.getFloat64(0, true)
    }
    monitorDistanceLeft = (error: (BleError | null), characteristic: (Characteristic | null)) => {
        if (error) {
            this.connectedToDevice = false
            this.device = null
            BikeBLE.error(error)
            return
        }
        if (!characteristic?.value) {
            BikeBLE.error("monitor distance to the left of bike: no data")
            return
        }
        for (const listener of this.distanceLeftListeners) {
            listener(this.parseDoubleFromData(characteristic.value))
        }
    }
    monitorTemperature = (error: (BleError | null), characteristic: (Characteristic | null)) => {
        if (error) {
            this.connectedToDevice = false
            this.device = null
            BikeBLE.error(error)
            return
        }
        if (!characteristic?.value) {
            BikeBLE.error("monitor temperature: no data")
            return
        }

        for (const listener of this.temperatureListeners) {
            listener(this.parseFloatFromData(characteristic.value))
        }
    }
    monitorHumidity = (error: (BleError | null), characteristic: (Characteristic | null)) => {
        if (error) {
            this.connectedToDevice = false
            this.device = null
            BikeBLE.error(error)
            return
        }
        if (!characteristic?.value) {
            BikeBLE.error("monitor humidity: no data")
            return
        }
        for (const listener of this.humidityListeners) {
            listener(this.parseFloatFromData(characteristic.value))
        }
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new BikeBLE()
        }
        return this.instance
    }

}
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const Base64 = {
    btoa: (input:string = '')  => {
        let str = input;
        let output = '';

        for (let block = 0, charCode, i = 0, map = chars;
             str.charAt(i | 0) || (map = '=', i % 1);
             output += map.charAt(63 & block >> 8 - i % 1 * 8)) {

            charCode = str.charCodeAt(i += 3/4);

            if (charCode > 0xFF) {
                throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
            }

            block = block << 8 | charCode;
        }

        return output;
    },

    atob: (input:string = '') => {
        let str = input.replace(/=+$/, '');
        let output = '';

        if (str.length % 4 == 1) {
            throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
        }
        for (let bc = 0, bs = 0, buffer, i = 0;
             buffer = str.charAt(i++);

             ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
             bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
        ) {
            buffer = chars.indexOf(buffer);
        }

        return output;
    }
};

function _arrayBufferToBase64( buffer: ArrayBuffer) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return Base64.btoa( binary );
}

export default BikeBLE

