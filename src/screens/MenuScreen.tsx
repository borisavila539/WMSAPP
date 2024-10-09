import React, { FC, useEffect, useState } from 'react'
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { ScreensInterface } from '../interfaces/ScreeensInterface'
import { RootStackParams } from '../navigation/navigation'
import { StackScreenProps } from '@react-navigation/stack'
import { grey, navy } from '../constants/Colors'
import Header from '../components/Header'

type props = StackScreenProps<RootStackParams, "MenuScreen">
export const MenuScreen: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<ScreensInterface[]>([])

    const setScreens = () => {
        let tmp: ScreensInterface[] = [
            { Name: 'Diarios de Salida', Screen: 'SeleccionarDiarioScreen', image: require('../assets/DiarioSalida.png') },
            { Name: 'Diarios de Entrada', Screen: 'SeleccionarDiariosEntradaScreen', image: require('../assets/DiarioEntrada.png') },
            { Name: 'Despacho Tela', Screen: 'Seleccionartraslados', image: require('../assets/DespachoTela.jpg') },
            { Name: 'Busqueda Rollos', Screen: 'BusquedaRolloAXScreen', image: require('../assets/DespachoTela.jpg') },
            { Name: 'Ciclico Tela', Screen: 'DiariosinventarioCiclicoTelaScreen', image: require('../assets/DespachoTela.jpg') },
            { Name: 'Reduccion Cajas', Screen: 'ReduccionCajasScreen', image: require('../assets/AuditoriaImagen.png') },
            { Name: 'Despacho PT', Screen: 'MenuDespachoPTScreen', image: require('../assets/DespachoPT.png') },
            { Name: 'Diarios de Tranferencia', Screen: 'SeleccionarDiarioTransferirScreen', image: require('../assets/Transferir.png') },
            { Name: 'Recepcion Ubicacion Caja', Screen: 'RecepcionUbicacionCajasScreen', image: require('../assets/DiarioEntrada.png') },
            { Name: 'Declaracion de Envio', Screen: 'DeclaracionEnvioScreen', image: require('../assets/Packing.png') },
            { Name: 'Control Cajas Etiqueta', Screen: 'ControlCajaEtiquetasScreen', image: require('../assets/AuditoriaImagen.png') }, 
            { Name: 'Auditoria Denim', Screen: 'AuditoriaCajaDenimScreen', image: require('../assets/AuditoriaImagen.png') },            

        ]
        setData(tmp)
    }

    const renderItem = (item: ScreensInterface) => {
        return (
            <View style={{ width: '50%', alignItems: 'center' }}>
                <View style={{ width: '95%', borderWidth: 1, alignItems: 'center', borderRadius: 15, paddingVertical: 5, marginTop: 5 }}>
                    <TouchableOpacity onPress={() => navigation.navigate(item.Screen)} style={{alignItems: 'center'}}>
                        <Image
                            source={item.image}
                            style={{ width: 100, height: 100, resizeMode: 'contain' }}
                        />
                        <Text style={{ color: navy, textAlign: 'center' }}>{item.Name}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    useEffect(() => {
        setScreens()
    }, [])
    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey }}>
            <Header texto1='' texto2='Menu' texto3='' />
            <FlatList
                data={data}
                keyExtractor={(item) => item.Screen.toString()}
                renderItem={({ item, index }) => renderItem(item)}
                showsVerticalScrollIndicator={false}
                numColumns={2}
            />
        </View>
    )
}
