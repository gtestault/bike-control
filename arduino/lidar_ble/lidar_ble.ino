/*
  Battery Monitor
  This example creates a BLE peripheral with the standard battery service and
  level characteristic. The A0 pin is used to calculate the battery level.
  The circuit:
  - Arduino MKR WiFi 1010, Arduino Uno WiFi Rev2 board, Arduino Nano 33 IoT,
    Arduino Nano 33 BLE, or Arduino Nano 33 BLE Sense board.
  You can use a generic BLE central app, like LightBlue (iOS and Android) or
  nRF Connect (Android), to interact with the services and characteristics
  created in this sketch.
  This example code is in the public domain.
*/

#include <ArduinoBLE.h>
#include <stdint.h>
#include <Wire.h>
#include "LIDARLite_v4LED.h"

#define FAST_I2C

LIDARLite_v4LED myLidarLite;
BLEService lidarService("bdb7d889-18b3-4342-b7d7-e3201e5fa3ef");

BLEUnsignedIntCharacteristic distanceChar("f71b8d3f-eb1c-495f-9e61-b8a773f2867f", BLERead | BLENotify); 
BLEDescriptor distanceDescriptor("bdb7d889-18b3-4342-b7d7-e3201e5fa3ef", "cm");

long previousMillis = 0;  

void setup() {
  Serial.begin(9600);    // initialize serial communication
  while (!Serial);
  setupBLE();
  setupLIDAR();
}

void loop() {
  // wait for a BLE central
  BLEDevice central = BLE.central();
  // if a central is connected to the peripheral:
  if (central) {
    Serial.print("Connected to central: ");
    // print the central's BT address:
    Serial.println(central.address());
    // turn on the LED to indicate the connection:
    digitalWrite(LED_BUILTIN, HIGH);

    // check the battery level every 200ms
    // while the central is connected:
    while (central.connected()) {
      long currentMillis = millis();
      if (currentMillis - previousMillis >= 200) {
        previousMillis = currentMillis;
        updateMeasuredDistance();
      }
    }
    // when the central disconnects, turn off the LED:
    digitalWrite(LED_BUILTIN, LOW);
    Serial.print("Disconnected from central: ");
    Serial.println(central.address());
  }
}

void setupBLE() {
  pinMode(LED_BUILTIN, OUTPUT); // initialize the built-in LED pin to indicate when a central is connected

  // begin initialization
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");

    while (1);
  }

  /* Set a local name for the BLE device
     This name will appear in advertising packets
     and can be used by remote devices to identify this BLE device
     The name can be changed but maybe be truncated based on space left in advertisement packet
  */
  BLE.setLocalName("LidarService");
  BLE.setAdvertisedService(lidarService); // add the service UUID
  lidarService.addCharacteristic(distanceChar);
  BLE.addService(lidarService);
  distanceChar.addDescriptor(distanceDescriptor);
  distanceChar.writeValue(0); // set initial value for this characteristic

  /* Start advertising BLE.  It will start continuously transmitting BLE
     advertising packets and will be visible to remote BLE central devices
     until it receives a new connection */

  // start advertising
  BLE.advertise();

  Serial.println("Bluetooth device active, waiting for connections...");
}

void setupLIDAR() {
   // Initialize Arduino I2C (for communication to LidarLite)
    Wire.begin();
    #ifdef FAST_I2C
        #if ARDUINO >= 157
            Wire.setClock(400000UL); // Set I2C frequency to 400kHz (for Arduino Due)
        #else
            TWBR = ((F_CPU / 400000UL) - 16) / 2; // Set I2C frequency to 400kHz
        #endif
    #endif

    //digitalWrite(SCL, HIGH);
    //digitalWrite(SDA, HIGH);
    myLidarLite.configure(0);

    //uint8_t dataByte = 0x00;
    //myLidarLite.write(0xEB, &dataByte, 1, 0x62); // Turn off high accuracy mode
}

//---------------------------------------------------------------------
// Read Continuous Distance Measurements
//
// The most recent distance measurement can always be read from
// device registers. Polling for the BUSY flag in the STATUS
// register can alert the user that the distance measurement is new
// and that the next measurement can be initiated. If the device is
// BUSY this function does nothing and returns 0. If the device is
// NOT BUSY this function triggers the next measurement, reads the
// distance data from the previous measurement, and returns 1.
//---------------------------------------------------------------------
uint8_t distanceContinuous(uint16_t * distance)
{
    uint8_t newDistance = 0;
    // Check on busyFlag to indicate if device is idle
    // (meaning = it finished the previously triggered measurement)
    if (myLidarLite.getBusyFlag() == 0)
    {
        // Trigger the next range measurement
        myLidarLite.takeRange();

        // Read new distance data from device registers
        *distance = myLidarLite.readDistance();

        // Report to calling function that we have new data
        newDistance = 1;
    } else {
      Serial.println("busy");
    }

    return newDistance;
}


void updateMeasuredDistance() {
  uint16_t distance;
  uint8_t  newDistance;
  unsigned int udistance;
  newDistance = distanceContinuous(&distance);
  if (newDistance)
  {
         udistance = distance;
         Serial.println(distance);
         distanceChar.writeValue(udistance);
  }
}
