export interface BleDevice {
  id: string;
  name: string;
  rssi: number | null;
}

export interface ProvisionCredentials {
  ssid: string;
  pass: string;
  host: string;
  u: string;          // MQTT username
  p: string;          // MQTT password
  id: string;         // Device UUID — ESP32 uses this in its MQTT client ID and topics
  base_topic: string; // MQTT base topic: pld/u/{userId}/d/{deviceId}
}

/** Step in the pairing flow */
export type PairingStep = 'idle' | 'preparing' | 'scanning' | 'connecting' | 'form' | 'provisioning' | 'done';
