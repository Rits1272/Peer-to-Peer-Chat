import 'react-native-gesture-handler';

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Home from './src/screens/Home';
import Splash from './src/screens/Splash';
import Chat from './src/screens/Chat';
import NearbyMessages from './src/screens/NearbyMessages';
import NearbyChat from './src/screens/NearbyChat';

const Stack = createStackNavigator();

export default function App(){
  return(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Wifi P2P" component={NearbyMessages}/>
        <Stack.Screen name="Chat" component={Chat}/>
        <Stack.Screen name="NearbyChat" component={NearbyChat}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}