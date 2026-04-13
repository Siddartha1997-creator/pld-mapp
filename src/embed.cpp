/**
 * ESP32-WROOM Firmware: BLE Provisioning + MQTT Control
 *
 * IMPORTANT — FLASH SIZE FIX REQUIRED (this is why you're getting the boot crash):
 *
 * The error "Detected size(4096k) smaller than size in binary header(8192k)"
 * means your IDE is compiling for 8MB flash but the ESP32-WROOM has 4MB.
 *
 * Arduino IDE fix:
 *   Tools > Board > ESP32 Dev Module
 *   Tools > Flash Size > "4MB (32Mb)"
 *   Tools > Partition Scheme > "Default 4MB with spiffs" (or "Huge APP (3MB No OTA/1MB SPIFFS)")
 *   Then do: Tools > Erase Flash > "All Flash Contents" before uploading.
 *
 * PlatformIO fix — add to platformio.ini:
 *   board_build.flash_size = 4MB
 *   board_build.partitions = default.csv
 */

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define LED_PIN 2
#define BOOT_BUTTON 16

Preferences pref;
WiFiClientSecure secureClient;
PubSubClient mqttClient(secureClient);

bool dataReceived = false;
String receivedJson = "";

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];
  Serial.println("MQTT: " + message);
  if (message == "on") digitalWrite(LED_PIN, HIGH);
  else if (message == "off") digitalWrite(LED_PIN, LOW);
}

class MyCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    receivedJson = String(pCharacteristic->getValue().c_str());
    dataReceived = true;
  }
};

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BOOT_BUTTON, INPUT_PULLUP);

  pref.begin("mqt_creds", true);
  String ssid = pref.getString("ssid", "");
  pref.end();

  if (ssid == "") {
    Serial.println("Mode: Provisioning (BLE)...");
    BLEDevice::init("ESP32_Config");
    BLEDevice::setMTU(512);
    BLEServer *pServer = BLEDevice::createServer();
    BLEService *pService = pServer->createService(SERVICE_UUID);
    BLECharacteristic *pChar = pService->createCharacteristic(
      CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_WRITE
    );
    pChar->setCallbacks(new MyCallbacks());
    pService->start();
    BLEDevice::getAdvertising()->start();
    Serial.println("BLE advertising started. Waiting for credentials...");
  } else {
    Serial.println("Mode: Connecting WiFi...");
    pref.begin("mqt_creds", true);
    String pass = pref.getString("pass", "");
    pref.end();
    WiFi.begin(ssid.c_str(), pass.c_str());
  }
}

void processProvisioning() {
  dataReceived = false;
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, receivedJson);

  if (error) {
    Serial.println("JSON parse error: " + String(error.c_str()));
    return;
  }

  pref.begin("mqt_creds", false);
  pref.putString("ssid", doc["ssid"] | "");
  pref.putString("pass", doc["pass"] | "");
  pref.putString("host", doc["host"] | "");
  pref.putString("u",    doc["u"]    | "");
  pref.putString("p",    doc["p"]    | "");
  pref.end();

  Serial.println("Credentials saved. Restarting...");
  delay(500);
  ESP.restart();
}

void connectMQTT() {
  pref.begin("mqt_creds", true);
  String host = pref.getString("host", "");
  String user = pref.getString("u", "");
  String pass = pref.getString("p", "");
  pref.end();

  if (host == "") return;

  secureClient.setInsecure();
  mqttClient.setServer(host.c_str(), 8883);
  mqttClient.setCallback(mqttCallback);

  Serial.println("Connecting to MQTT...");
  if (mqttClient.connect("ESP32_Client", user.c_str(), pass.c_str())) {
    Serial.println("MQTT connected.");
    mqttClient.subscribe("home/led");
  } else {
    Serial.print("MQTT connect failed, rc=");
    Serial.println(mqttClient.state());
    delay(5000);
  }
}

void loop() {
  if (dataReceived) {
    processProvisioning();
    return;
  }

  if (digitalRead(BOOT_BUTTON) == LOW) {
    Serial.println("Factory reset triggered...");
    pref.begin("mqt_creds", false);
    pref.clear();
    pref.end();
    delay(500);
    ESP.restart();
  }

  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) {
      connectMQTT();
    }
    mqttClient.loop();
  }
}
