import React, {useEffect, useRef, useState} from "react";
import MapView, {Circle, Marker, PROVIDER_GOOGLE, Region} from 'react-native-maps';
import {StackNavigationProp} from "@react-navigation/stack";
import {RootStackParamList} from "../../App";
import * as _ from "lodash";
import {
    Dimensions,
    Button,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    TouchableHighlight, TouchableOpacity, Pressable
} from "react-native";
import MapStyle from "../service/MapStyle";
import Geolocation from '@react-native-community/geolocation';
import {FontAwesomeIcon} from "@fortawesome/react-native-fontawesome";
import {faThermometerHalf, faTint, faBiking, faCog, faMicrochip, faCrosshairs} from "@fortawesome/free-solid-svg-icons";
import BikeBLE, {HumidityListener, TemperatureListener} from "../service/BikeBLE";


type NavigationScreenNavigationProp = StackNavigationProp<RootStackParamList,
    'NavigationScreen'>;
type Props = {
    navigation: NavigationScreenNavigationProp
}
type Coordinates = {
    altitude: number | null
    latitude: number
    longitude: number
}

enum BleConnectionState {
    CONNECTED,
    DISCONNECTED,
    ERROR,
}

export const NavigationScreen = ({navigation}: Props) => {
    const [coords, setCoords] = useState<Coordinates>({longitude: 0, latitude: 0, altitude: null,})
    const [region, setRegion] = useState<Region>({
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015
    })
    const [centerView, setCenterView] = useState(0)
    const [temperature, setTemperature] = useState("no data")
    const [humidity, setHumidity] = useState("no data")
    const [bleConnectionState, setBleConnectionState] = useState<BleConnectionState>(BleConnectionState.DISCONNECTED)
    const mapRef = useRef<MapView | null>(null)
    const updateTemp: TemperatureListener = (temperature) => {setTemperature(temperature)}
    const updateHumidity: HumidityListener = (humidity) => {setHumidity(humidity)}
    useEffect(() => {
        BikeBLE.getInstance().waitForDevice()
            .then(() => {
                setBleConnectionState(BleConnectionState.CONNECTED)
                BikeBLE.getInstance().subscribeTemperature(_.throttle(updateTemp, 10000))
                BikeBLE.getInstance().subscribeHumidity(_.throttle(updateHumidity, 10000))
            })
            .catch(e => {
                setBleConnectionState(BleConnectionState.ERROR)
            })
        return () => {BikeBLE.getInstance().destroyConnection()}
    }, [])

    useEffect(() => {
        Geolocation.getCurrentPosition(
            info => {
                setCoords({
                    latitude: info.coords.latitude,
                    longitude: info.coords.longitude,
                    altitude: info.coords.altitude
                })
                if (mapRef.current) {
                    mapRef.current.animateToRegion({latitude: info.coords.latitude, longitude: info.coords.longitude, latitudeDelta: 0.015, longitudeDelta: 0.015}, 500)
                }
            });
    }, [centerView])

    const renderMap = () => {
        return (
            <MapView
                onMapReady={() => setCenterView(centerView + 1)}
                ref={mapRef}
                customMapStyle={MapStyle}
                provider={PROVIDER_GOOGLE} // remove if not using Google Maps
                style={styles.map}
                region={region}
                onRegionChangeComplete={setRegion}
            >
                <Marker tracksViewChanges={false} coordinate={{latitude: coords.latitude, longitude: coords.longitude}}>
                    <FontAwesomeIcon icon={faBiking} size={40} color={"white"}/>
                </Marker>

            </MapView>
        )
    }

    const renderBleConnectionState = () => {
        switch (bleConnectionState) {
            case BleConnectionState.CONNECTED:
               return <FontAwesomeIcon icon={faMicrochip} size={32} color={"white"}/>
            case BleConnectionState.DISCONNECTED:
               return <ActivityIndicator color={"white"} size="large"/>
            case BleConnectionState.ERROR:
                return <FontAwesomeIcon icon={faMicrochip} size={32} color={"red"}/>
        }
    }

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <View style={styles.controlPanel}>
                    <TouchableOpacity style={styles.arduinoButton} activeOpacity={0.8} onPress={() => {
                        BikeBLE.getInstance().destroyConnection()
                    }}>
                        {renderBleConnectionState()}
                    </TouchableOpacity>
                    <TouchableHighlight underlayColor={"#bbbbbb"} style={styles.controlButton} onPress={() => {
                        setCenterView(centerView + 1)
                    }}>
                        <FontAwesomeIcon icon={faCrosshairs} size={32}/>
                    </TouchableHighlight>
                    <TouchableHighlight underlayColor={"#bbbbbb"} style={styles.controlButton} onPress={() => {
                        navigation.navigate("SettingsScreen")
                    }}>
                        <FontAwesomeIcon icon={faCog} size={32}/>
                    </TouchableHighlight>
                </View>
                {renderMap()}
                <View style={styles.humidityView}>
                    <FontAwesomeIcon icon={faTint} size={32} color={"white"}/>
                    <Text style={styles.overlayText}>{humidity}%</Text>
                </View>
                <View style={styles.temperatureView}>
                    <FontAwesomeIcon icon={faThermometerHalf} size={32} color={"white"}/>
                    <Text style={styles.overlayText}>{temperature}°C</Text>
                </View>
            </View>
        </SafeAreaView>
    )
};

const ScreenHeight = Dimensions.get("window").height
const ScreenWidth = Dimensions.get("window").width
const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        display: "flex",
        flexDirection: "column",
        height: ScreenHeight,
        width: ScreenWidth,
    },
    controlPanel: {
        height: "10%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
    },
    arduinoButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: 2,
        height: "100%",
        backgroundColor: "#003594",
    },
    controlButton: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: 2,
        height: "100%",
        backgroundColor: "white",
    },
    settingsContainer: {
        position: "absolute",
        height: 100,
        width: 100,
        top: 10,
        right: 10,
        zIndex: 100,
        backgroundColor: "white",
        borderRadius: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    temperatureView: {
        color: "white",
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        position: "absolute",
        bottom: 40,
        left: 15,
    },
    humidityView: {
        color: "white",
        display: "flex",
        justifyContent: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        position: "absolute",
        bottom: 80,
        left: 15,
    },
    overlayText: {
        color: "white",
        marginLeft: 10
    },
    map: {
        flex: 1,
    },
})
