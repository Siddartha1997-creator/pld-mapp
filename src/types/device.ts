export type DeviceType = 'camera' | 'switch';

/** Extensible list of device type metadata — add new entries to support more device types */
export const DEVICE_TYPE_META: Record<DeviceType, { label: string; icon: string }> = {
  camera: { label: 'Camera', icon: 'camera-outline' },
  switch: { label: 'Switch', icon: 'toggle-outline' },
};

/** Shape of a device document stored in Appwrite */
export interface Device {
  $id: string;            // Appwrite document ID
  deviceId: string;       // Stable UUID used in MQTT topics
  name: string;
  type: DeviceType;
  userId: string;         // Appwrite user.$id of the owner
  mqttBaseTopic: string;  // pld/u/{userId}/d/{deviceId}
  isOnline: boolean;
  lastSeen: string;       // ISO 8601 timestamp
  firmwareVersion: string;
  metadata: string;       // JSON-encoded blob for future extensibility
}
