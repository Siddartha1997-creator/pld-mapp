/**
 * MQTT topic builder.
 *
 * All topics are scoped to userId + deviceId so HiveMQ ACL rules can enforce
 * per-user isolation at the broker level with a single wildcard rule:
 *   allow pld/u/{userId}/d/#  for the authenticated user
 *
 * Channel semantics:
 *   cmd        app → device  commands         (QoS 1, retain: false)
 *   state      device → app  last known state (QoS 1, retain: true)
 *   cam        device → app  JPEG frames      (QoS 0, retain: false)
 *   telemetry  device → app  sensor readings  (QoS 0, retain: false)
 */
export const mqttTopics = {
  /** Base namespace — used as the prefix for all device channels */
  base: (userId: string, deviceId: string): string =>
    `pld/u/${userId}/d/${deviceId}`,

  /** Command topic: app publishes here to control the device */
  cmd: (userId: string, deviceId: string): string =>
    `pld/u/${userId}/d/${deviceId}/cmd`,

  /** State topic: device publishes its current state here */
  state: (userId: string, deviceId: string): string =>
    `pld/u/${userId}/d/${deviceId}/state`,

  /** Camera stream topic: device publishes base64 JPEG frames here */
  cam: (userId: string, deviceId: string): string =>
    `pld/u/${userId}/d/${deviceId}/cam`,

  /** Telemetry topic: device publishes sensor data here */
  telemetry: (userId: string, deviceId: string): string =>
    `pld/u/${userId}/d/${deviceId}/telemetry`,

  /** Wildcard to subscribe to all events from a single device */
  allDeviceEvents: (userId: string, deviceId: string): string =>
    `pld/u/${userId}/d/${deviceId}/+`,

  /** Wildcard to subscribe to all events from all of a user's devices */
  allUserEvents: (userId: string): string =>
    `pld/u/${userId}/d/+/+`,
};
