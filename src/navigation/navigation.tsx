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
import { DespachoPTAuditoria } from '../screens/DespachoPT/Auditoria/DespachoPTAuditoria';
import { DespachoPTAuditoriaCajas } from '../screens/DespachoPT/Auditoria/DespachoPTAuditoriaCajas';
import { DespachoPTAuditoriaCajasLineas } from '../screens/DespachoPT/Auditoria/DespachoPTAuditoriaCajasLineas';
import { DespachoPTConsultaOPDespachos } from '../screens/DespachoPT/ConsultaOP/DespachoPTConsultaOPDespachos';
import { DespachoPTConsultaOPDetalle } from '../screens/DespachoPT/ConsultaOP/DespachoPTConsultaOPDetalle';
import { ReduccionCajasScreen2 } from '../screens/Reduccion Cajas/ReduccionCajasScreen2';
import { BusquedaRolloAXScreen } from '../screens/BusquedaRolloAX/BusquedaRolloAXScreen';
import { DespachoRecibidoLiquidacionScreen } from '../screens/DespachoPT/Liquidacion/DespachoRecibidoLiquidacionScreen';
import { OrdenesLiquidacionScreen } from '../screens/DespachoPT/Liquidacion/OrdenesLiquidacionScreen';
import { DestalleOrdenLiquidacionScreen } from '../screens/DespachoPT/Liquidacion/DestalleOrdenLiquidacionScreen';
import { DiariosinventarioCiclicoTelaScreen } from '../screens/InventarioCiclicoTela/DiariosinventarioCiclicoTelaScreen';
import { DetalleInventarioCliclicoTelaScreen } from '../screens/InventarioCiclicoTela/DetalleInventarioCliclicoTelaScreen';

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
    ReduccionCajasScreen2: undefined,
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
    DespachoPTAuditoria: undefined,
    DespachoPTAuditoriaCajas: undefined,
    DespachoPTAuditoriaCajasLineas: undefined,
    DespachoPTConsultaOPDespachos: undefined,
    DespachoPTConsultaOPDetalle: undefined,
    BusquedaRolloAXScreen: undefined,
    DespachoRecibidoLiquidacionScreen: undefined,
    OrdenesLiquidacionScreen: undefined,
    DestalleOrdenLiquidacionScreen:undefined,
    DiariosinventarioCiclicoTelaScreen: undefined,
    DetalleInventarioCliclicoTelaScreen:undefined
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
            <Stack.Screen name='ReduccionCajasScreen2' options={{ title: 'ReduccionCajasScreen2' }} component={ReduccionCajasScreen2} />

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
            <Stack.Screen name='DespachoPTAuditoria' options={{ title: 'DespachoPTAuditoria' }} component={DespachoPTAuditoria} />
            <Stack.Screen name='DespachoPTAuditoriaCajas' options={{ title: 'DespachoPTAuditoriaCajas' }} component={DespachoPTAuditoriaCajas} />
            <Stack.Screen name='DespachoPTAuditoriaCajasLineas' options={{ title: 'DespachoPTAuditoriaCajasLineas' }} component={DespachoPTAuditoriaCajasLineas} />
            <Stack.Screen name='DespachoPTConsultaOPDespachos' options={{ title: 'DespachoPTConsultaOPDespachos' }} component={DespachoPTConsultaOPDespachos} />
            <Stack.Screen name='DespachoPTConsultaOPDetalle' options={{ title: 'DespachoPTConsultaOPDetalle' }} component={DespachoPTConsultaOPDetalle} />
            
            {/* Busqeuda de rollos */}
            <Stack.Screen name='BusquedaRolloAXScreen' options={{ title: 'BusquedaRolloAXScreen' }} component={BusquedaRolloAXScreen} />

            {/* Liquidacion */}
            <Stack.Screen name='DespachoRecibidoLiquidacionScreen' options={{ title: 'DespachoRecibidoLiquidacionScreen' }} component={DespachoRecibidoLiquidacionScreen} />
            <Stack.Screen name='OrdenesLiquidacionScreen' options={{ title: 'OrdenesLiquidacionScreen' }} component={OrdenesLiquidacionScreen} />
            <Stack.Screen name='DestalleOrdenLiquidacionScreen' options={{ title: 'DestalleOrdenLiquidacionScreen' }} component={DestalleOrdenLiquidacionScreen} />

            {/*Inventario cilico tela */}

            <Stack.Screen name='DiariosinventarioCiclicoTelaScreen' options={{ title: 'DiariosinventarioCiclicoTelaScreen' }} component={DiariosinventarioCiclicoTelaScreen} />
            <Stack.Screen name='DetalleInventarioCliclicoTelaScreen' options={{ title: 'DetalleInventarioCliclicoTelaScreen' }} component={DetalleInventarioCliclicoTelaScreen} />
        </Stack.Navigator>
    )
}
