import React, {useEffect, useState} from "react";
import MapView, {Circle, PROVIDER_GOOGLE, Region} from 'react-native-maps';
import {StackNavigationProp} from "@react-navigation/stack";
import {RootStackParamList} from "../../App";
import {
    Dimensions,
    Button,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    TouchableHighlight
} from "react-native";
import MapStyle from "../service/MapStyle";
import Geolocation from '@react-native-community/geolocation';
import {FontAwesomeIcon} from "@fortawesome/react-native-fontawesome";
import {faCog} from "@fortawesome/free-solid-svg-icons";


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
export const NavigationScreen = ({navigation}: Props) => {
    const [coords, setCoords] = useState<Coordinates >({longitude: 0, latitude: 0, altitude: null,})
    const [region, setRegion] = useState<Region>({
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015
    })
    useEffect(() => {
        Geolocation.getCurrentPosition(
            info => {
                setCoords({
                    latitude: info.coords.latitude,
                    longitude: info.coords.longitude,
                    altitude: info.coords.altitude
                })
                setRegion({...region, latitude: info.coords.latitude, longitude: info.coords.longitude})
            });
    }, [])

    const renderMap = () => {
        return (
            <MapView
                customMapStyle={MapStyle}
                provider={PROVIDER_GOOGLE} // remove if not using Google Maps
                style={styles.map}
                region={region}
                onRegionChangeComplete={setRegion}
            >

            <Circle center={{latitude: coords.latitude, longitude: coords.longitude}} radius={30} strokeWidth={4} fillColor="white"/>
            </MapView>
        )
    }
    return (
        <SafeAreaView>
            <View style={styles.container}>
                {renderMap()}
            </View>
            <TouchableHighlight
                activeOpacity={0.6}
                underlayColor="#DDDDDD"
                onPress={() => console.log('Pressed!')}>

                <View style={styles.settingsContainer}>
                    <FontAwesomeIcon icon={faCog} size={20}/>
                </View>
            </TouchableHighlight>
        </SafeAreaView>
    )
};

const ScreenHeight = Dimensions.get("window").height
const ScreenWidth = Dimensions.get("window").width
const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        height: ScreenHeight,
        width: ScreenWidth,
    },
    settingsContainer: {
        position: "absolute",
        height: 100,
        width: 100,
        top: 10,
        right: 10,
        backgroundColor: "white",
        borderRadius: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
})