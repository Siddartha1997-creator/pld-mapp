import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { BLE_SCAN_TIMEOUT_MS, ESP32_CHAR_UUID, ESP32_SERVICE_UUID } from '../constants/ble';
import { BleDevice, PairingStep, ProvisionCredentials } from '../types/ble';

// Module-level singleton — avoids re-initialising the native layer on re-renders
const bleManager = new BleManager();

// Wait for BLE to be powered on
function waitForBlePoweredOn(timeout: number = 15000): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const sub = bleManager.onStateChange((state) => {
      console.log("Current Bluetooth State:", state);
      
      if (state === 'PoweredOn') {
        settled = true;
        sub.remove();
        resolve(true);
      } else if (state === 'Unauthorized') {
        settled = true;
        sub.remove();
        reject(new Error("Bluetooth permission denied. Check Info.plist and Settings."));
      }
    }, true); // 'true' forces it to fire immediately with current state

    setTimeout(() => {
      if (!settled) {
        settled = true;
        sub.remove();
        bleManager.state().then((state) => {
          reject(new Error(`Bluetooth timeout: State is still ${state}`));
        }).catch(() => {
          reject(new Error('Bluetooth timeout: Unable to check state'));
        });
      }
    }, timeout);
  });
}

async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') return true;

  if ((Platform.Version as number) >= 31) {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(results).every(
      (r) => r === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

interface UseBleReturn {
  step: PairingStep;
  devices: BleDevice[];
  selectedDevice: BleDevice | null;
  error: string | null;
  startScan: () => void;
  stopScan: () => void;
  selectDevice: (device: BleDevice) => Promise<void>;
  provision: (credentials: ProvisionCredentials) => Promise<void>;
  reset: () => void;
}

export default function useBle(): UseBleReturn {
  const [step, setStep] = useState<PairingStep>('idle');
  const [devices, setDevices] = useState<BleDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BleDevice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectedRef = useRef<Device | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearScanTimer = () => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  };

  const startScan = useCallback(async () => {
    setError(null);
    setDevices([]);

    const granted = await requestBlePermissions();
    if (!granted) {
      setError('Bluetooth permissions are required to scan for devices.');
      return;
    }

    setStep('preparing');

    // Wait for BLE radio to be ready
    try {
      await waitForBlePoweredOn(BLE_SCAN_TIMEOUT_MS);
    } catch (e: any) {
      setError(e?.message ?? 'Bluetooth is not ready.');
      setStep('idle');
      return;
    }

    setStep('scanning');

    bleManager.startDeviceScan(null, { allowDuplicates: false }, (err, device) => {
      if (err) {
        setError(err.message);
        setStep('idle');
        return;
      }
      if (device?.name) {
        setDevices((prev) => {
          if (prev.some((d) => d.id === device.id)) return prev;
          return [...prev, { id: device.id, name: device.name!, rssi: device.rssi }];
        });
      }
    });

    scanTimerRef.current = setTimeout(() => {
      bleManager.stopDeviceScan();
      setStep((current) => (current === 'scanning' ? 'idle' : current));
    }, BLE_SCAN_TIMEOUT_MS);
  }, []);

  const stopScan = useCallback(() => {
    clearScanTimer();
    bleManager.stopDeviceScan();
    setStep('idle');
  }, []);

  const selectDevice = useCallback(async (device: BleDevice) => {
    clearScanTimer();
    bleManager.stopDeviceScan();
    setStep('connecting');
    setSelectedDevice(device);
    setError(null);

    try {
      const connected = await bleManager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();
      connectedRef.current = connected;
      setStep('form');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to connect to device.');
      setStep('idle');
      setSelectedDevice(null);
    }
  }, []);

  const provision = useCallback(async (credentials: ProvisionCredentials) => {
    if (!connectedRef.current) {
      setError('No device connected.');
      return;
    }

    setStep('provisioning');
    setError(null);

    try {
      const json = JSON.stringify(credentials);
      // btoa is available globally in React Native (JavaScriptCore / Hermes)
      const base64 = btoa(json);

      await connectedRef.current.writeCharacteristicWithResponseForService(
        ESP32_SERVICE_UUID,
        ESP32_CHAR_UUID,
        base64
      );

      setStep('done');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send credentials.');
      setStep('form');
    }
  }, []);

  const reset = useCallback(() => {
    clearScanTimer();
    bleManager.stopDeviceScan();
    connectedRef.current?.cancelConnection().catch(() => {});
    connectedRef.current = null;
    setStep('idle');
    setDevices([]);
    setSelectedDevice(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearScanTimer();
      bleManager.stopDeviceScan();
      connectedRef.current?.cancelConnection().catch(() => {});
    };
  }, []);

  return { step, devices, selectedDevice, error, startScan, stopScan, selectDevice, provision, reset };
}
