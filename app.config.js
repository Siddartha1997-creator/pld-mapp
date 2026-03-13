module.exports = {
  expo: {
    name: 'PLD SLM',
    slug: 'pld-slm',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      resizeMode: 'contain',
      backgroundColor: '#1a73e8',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.pldslm.app',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#1a73e8',
      },
      package: 'com.pldslm.app',
    },
    plugins: [
      'expo-secure-store',
      [
        'react-native-ble-plx',
        {
          isBackgroundEnabled: false,
          modes: ['peripheral', 'central'],
          bluetoothAlwaysPermission: 'Allow $(PRODUCT_NAME) to connect to Bluetooth devices for provisioning.',
        },
      ],
    ],
    extra: {
      HIVEMQ_ADMIN_USERNAME: process.env.HIVEMQ_ADMIN_USERNAME,
      HIVEMQ_ADMIN_PASSWORD: process.env.HIVEMQ_ADMIN_PASSWORD,
      AUTH_BASE_URL: process.env.AUTH_BASE_URL ?? 'http://localhost:8080',
      HIVEMQ_ORG_ID: process.env.HIVEMQ_ORG_ID ?? '',
      DEV_BYPASS_AUTH: process.env.DEV_BYPASS_AUTH ?? 'false',
    },
  },
};
