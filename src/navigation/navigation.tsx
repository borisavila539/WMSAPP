import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { LoginScreen } from '../screens/LoginScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { SeleccionarDiarioScreen } from '../screens/Diario Salida/SeleccionarDiarioScreen';
import { IngresarLineasScreen } from '../screens/Diario Salida/IngresarLineasScreen';
import { TelaoptionScreen } from '../screens/Despacho Tela/TelaoptionScreen';
import { TelaPickingScreen } from '../screens/Despacho Tela/Opciones/telaPickingScreen';
import { TelaPackingScreen } from '../screens/Despacho Tela/Opciones/Packing/TelaPackingScreen';
import { CamionChoferScreen } from '../screens/Despacho Tela/Opciones/Packing/CamionChoferScreen';
import { TelaReceiveScreen } from '../screens/Despacho Tela/Opciones/TelaReceiveScreen';
import {  SeleccionarTrasladosScreen } from '../screens/Despacho Tela/SeleccionarTraslados';
import { EstadoTrasladosScreen } from '../screens/Despacho Tela/Opciones/EstadoTrasladosScreen';
import { EstadotelaScreen } from '../screens/Despacho Tela/Opciones/EstadotelaScreen';
import { RollosDespachoScreen } from '../screens/Despacho Tela/Opciones/Packing/RollosDespachoScreen';
import { ReduccionCajasScreen } from '../screens/Reduccion Cajas/ReduccionCajasScreen';

export type RootStackParams = {
    LoginScreen: undefined,
    MenuScreen: undefined,
    SeleccionarDiarioScreen: undefined,
    IngresarLineasScreen: undefined,
    TelaOptionScreen: undefined,
    TelaPickingScreen: undefined
    TelaPackingScreen: undefined
    CamionChoferScreen: undefined
    TelaReceiveScreen:undefined,
    Seleccionartraslados:undefined
    EstadoTrasladoScreen:undefined
    EstadotelaScreen: undefined,
    RollosDespachoScreen:undefined,
    ReduccionCajasScreen:undefined
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
            <Stack.Screen name='TelaOptionScreen' options={{ title: 'TelaOptionScreen' }} component={TelaoptionScreen} />
            <Stack.Screen name='TelaPickingScreen' options={{ title: 'TelaPickingScreen' }} component={TelaPickingScreen} />
            <Stack.Screen name='TelaPackingScreen' options={{ title: 'TelaPackingScreen' }} component={TelaPackingScreen} />
            <Stack.Screen name='CamionChoferScreen' options={{ title: 'CamionChoferScreen' }} component={CamionChoferScreen} />
            <Stack.Screen name='TelaReceiveScreen' options={{ title: 'TelaReceiveScreen' }} component={TelaReceiveScreen} />
            <Stack.Screen name='Seleccionartraslados' options={{title:'Seleccionartraslados'}} component={SeleccionarTrasladosScreen}/>
            <Stack.Screen name='EstadoTrasladoScreen' options={{title:'EstadoTrasladoScreen'}} component={EstadoTrasladosScreen}/>
            <Stack.Screen name='EstadotelaScreen' options={{title:'EstadotelaScreen'}} component={EstadotelaScreen}/>
            <Stack.Screen name='RollosDespachoScreen' options={{title:'RollosDespachoScreen'}} component={RollosDespachoScreen}/>
            <Stack.Screen name='ReduccionCajasScreen' options={{title:'ReduccionCajasScreen'}} component={ReduccionCajasScreen}/>
        </Stack.Navigator>
    )
}
