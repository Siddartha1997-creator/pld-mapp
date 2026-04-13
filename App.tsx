import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

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
      <StatusBar barStyle="dark-content" />
      <AppInit />
    </AuthProvider>
  );
}
