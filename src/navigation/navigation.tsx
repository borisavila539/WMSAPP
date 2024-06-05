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
import { SeleccionarTrasladosScreen } from '../screens/Despacho Tela/SeleccionarTraslados';
import { EstadoTrasladosScreen } from '../screens/Despacho Tela/Opciones/EstadoTrasladosScreen';
import { EstadotelaScreen } from '../screens/Despacho Tela/Opciones/EstadotelaScreen';
import { RollosDespachoScreen } from '../screens/Despacho Tela/Opciones/Packing/RollosDespachoScreen';
import { ReduccionCajasScreen } from '../screens/Reduccion Cajas/ReduccionCajasScreen';
import { MenuDespachoPTScreen } from '../screens/DespachoPT/MenuDespachoPTScreen';
import { DespachoPTPickingScreen } from '../screens/DespachoPT/Picking/DespachoPTPickingScreen';
import { DespachoPTEstatusOP } from '../screens/DespachoPT/EstatusOP/DespachoPTEstatusOP';
import { DespachoPTPackingCamionChofer } from '../screens/DespachoPT/Packing/DespachoPTPackingCamionChofer';
import { DespachoPTOrdenesRecibir } from '../screens/DespachoPT/Recibir/DespachoPTOrdenesRecibir';
import { DespachoPTPacking } from '../screens/DespachoPT/Packing/DespachoPTPacking';
import { SeleccionarDiariosEntradaScreen } from '../screens/DiarioEntrada/SeleccionarDiariosEntradaScreen';
import { IngresarLineasDiarioEntrada } from '../screens/DiarioEntrada/IngresarLineasDiarioEntrada';
import { SeleccionarDiarioTransferirScreen } from '../screens/DiarioTransferir/SeleccionarDiarioTransferirScreen';
import { IngresarLineasDiarioTransferir } from '../screens/DiarioTransferir/IngresarLineasDiarioTransferir';
import { DespachoPTRecibir } from '../screens/DespachoPT/Recibir/DespachoPTRecibir';

export type RootStackParams = {
    LoginScreen: undefined,
    MenuScreen: undefined,
    SeleccionarDiarioScreen: undefined,
    IngresarLineasScreen: undefined,
    TelaOptionScreen: undefined,
    TelaPickingScreen: undefined
    TelaPackingScreen: undefined
    CamionChoferScreen: undefined
    TelaReceiveScreen: undefined,
    Seleccionartraslados: undefined
    EstadoTrasladoScreen: undefined
    EstadotelaScreen: undefined,
    RollosDespachoScreen: undefined,
    ReduccionCajasScreen: undefined,
    MenuDespachoPTScreen: undefined,
    DespachoPTPickingScreen: undefined,
    DespachoPTEstatusOP: undefined,
    DespachoPTPackingCamionChofer: undefined,
    DespachoPTOrdenesRecibir: undefined,
    DespachoPTPacking: undefined,
    SeleccionarDiariosEntradaScreen: undefined,
    IngresarLineasDiarioEntrada: undefined,
    SeleccionarDiarioTransferirScreen: undefined,
    IngresarLineasDiarioTransferir: undefined,
    DespachoPTRecibir: undefined,
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
            <Stack.Screen name='Seleccionartraslados' options={{ title: 'Seleccionartraslados' }} component={SeleccionarTrasladosScreen} />
            <Stack.Screen name='EstadoTrasladoScreen' options={{ title: 'EstadoTrasladoScreen' }} component={EstadoTrasladosScreen} />
            <Stack.Screen name='EstadotelaScreen' options={{ title: 'EstadotelaScreen' }} component={EstadotelaScreen} />
            <Stack.Screen name='RollosDespachoScreen' options={{ title: 'RollosDespachoScreen' }} component={RollosDespachoScreen} />
            <Stack.Screen name='ReduccionCajasScreen' options={{ title: 'ReduccionCajasScreen' }} component={ReduccionCajasScreen} />
            <Stack.Screen name='MenuDespachoPTScreen' options={{ title: 'MenuDespachoPTScreen' }} component={MenuDespachoPTScreen} />
            <Stack.Screen name='DespachoPTPickingScreen' options={{ title: 'DespachoPTPickingScreen' }} component={DespachoPTPickingScreen} />
            <Stack.Screen name='DespachoPTEstatusOP' options={{ title: 'DespachoPTEstatusOP' }} component={DespachoPTEstatusOP} />
            <Stack.Screen name='DespachoPTPackingCamionChofer' options={{ title: 'DespachoPTPackingCamionChofer' }} component={DespachoPTPackingCamionChofer} />
            <Stack.Screen name='DespachoPTOrdenesRecibir' options={{ title: 'DespachoPTOrdenesRecibir' }} component={DespachoPTOrdenesRecibir} />
            <Stack.Screen name='DespachoPTPacking' options={{ title: 'DespachoPTPacking' }} component={DespachoPTPacking} />
            <Stack.Screen name='SeleccionarDiariosEntradaScreen' options={{ title: 'SeleccionarDiariosEntradaScreen' }} component={SeleccionarDiariosEntradaScreen} />
            <Stack.Screen name='IngresarLineasDiarioEntrada' options={{ title: 'IngresarLineasDiarioEntrada' }} component={IngresarLineasDiarioEntrada} />
            <Stack.Screen name='SeleccionarDiarioTransferirScreen' options={{ title: 'SeleccionarDiarioTransferirScreen' }} component={SeleccionarDiarioTransferirScreen} />
            <Stack.Screen name='IngresarLineasDiarioTransferir' options={{ title: 'IngresarLineasDiarioTransferir' }} component={IngresarLineasDiarioTransferir} />
            <Stack.Screen name='DespachoPTRecibir' options={{ title: 'DespachoPTRecibir' }} component={DespachoPTRecibir} />
        </Stack.Navigator>
    )
}
