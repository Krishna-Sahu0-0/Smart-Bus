import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import EposShellScreen from './src/screens/EposShellScreen';
import TicketingScreen from './src/screens/TicketingScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import { getSession } from './src/services/authService';
import { colors } from './src/utils/constants';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    getSession().then(setSession).finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) return null;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={session ? 'Terminal' : 'Login'}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ink } }}
      >
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} onAuthenticated={setSession} />}
        </Stack.Screen>
        <Stack.Screen name="Terminal">
          {(props) => <EposShellScreen {...props} session={session} onLogout={() => setSession(null)} />}
        </Stack.Screen>
        <Stack.Screen name="Ticketing" component={TicketingScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
