export interface BleDevice {
  id: string;
  name: string;
  rssi: number | null;
}

export interface ProvisionCredentials {
  ssid: string;
  pass: string;
  host: string;
  u: string; // MQTT username
  p: string; // MQTT password
}

/** Step in the pairing flow */
export type PairingStep = 'idle' | 'preparing' | 'scanning' | 'connecting' | 'form' | 'provisioning' | 'done';
