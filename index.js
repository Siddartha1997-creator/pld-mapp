import { AppRegistry } from 'react-native';
import App from './App';

if (typeof process.env.EXPO_OS === 'undefined') {
  process.env.EXPO_OS = Platform.OS;
}

AppRegistry.registerComponent('pldslmmob001', () => App);
