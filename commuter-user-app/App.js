import { StatusBar } from 'expo-status-bar';
import { FleetProvider } from './src/context/FleetContext';
import FleetScreen from './src/screens/FleetScreen';

export default function App() {
  return <FleetProvider><StatusBar style="dark" /><FleetScreen /></FleetProvider>;
}
