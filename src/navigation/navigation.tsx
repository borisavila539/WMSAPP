import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { LoginScreen } from '../screens/LoginScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { SeleccionarDiarioScreen } from '../screens/SeleccionarDiarioScreen';
import { IngresarLineasScreen } from '../screens/IngresarLineasScreen';

export type RootStackParams = {
    LoginScreen: undefined,
    MenuScreen: undefined,
    SeleccionarDiarioScreen: undefined,
    IngresarLineasScreen: undefined
}

const Stack = createStackNavigator<RootStackParams>();

export const Navigation = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen name='LoginScreen' options={{ title: 'LoginScreen' }} component={LoginScreen} />
            <Stack.Screen name='MenuScreen' options={{ title: 'MenuScreen' }} component={MenuScreen} />
            <Stack.Screen name='SeleccionarDiarioScreen' options={{ title: 'SeleccionarDiarioScreen' }} component={SeleccionarDiarioScreen} />
            <Stack.Screen name='IngresarLineasScreen' options={{ title: 'IngresarLineasScreen' }} component={IngresarLineasScreen} />

        </Stack.Navigator>
    )
}
