import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

/**
 * Seeds the HiveMQ admin credentials into the keystore on first launch.
 * This runs inside AuthProvider so it has access to the auth context.
 */
function AppInit() {
  const { initAdminCredentials } = useAuth();

  useEffect(() => {
    initAdminCredentials();
  }, [initAdminCredentials]);

  return <RootNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppInit />
    </AuthProvider>
  );
}
