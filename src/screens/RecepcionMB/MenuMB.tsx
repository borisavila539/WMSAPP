import React, { FC, useContext, useEffect, useState } from 'react'
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { ScreensInterface } from '../../interfaces/ScreeensInterface'
import { RootStackParams } from '../../navigation/navigation'
import { StackScreenProps } from '@react-navigation/stack'
import { grey, navy } from '../../constants/Colors'
import Header from '../../components/Header'
import { WMSContext } from '../../context/WMSContext'
import { WMSApiMB } from '../../api/WMSApiMB'
import { RespuestaValidacionUsuario } from '../../interfaces/ReimpresiónEtiqueta/RespuestaValidacionUsuario'

type props = StackScreenProps<RootStackParams, "MenuMB">
export const MenuMB : FC<props> = ({ navigation }) => {
    const [data, setData] = useState<ScreensInterface[]>([])
    const { WMSState } = useContext(WMSContext);
 
    const setScreens = async () => {
        var usuairoValido = await WMSApiMB.get<boolean>(`ValidarAcceso/${WMSState.usuario}`);
        let tmp: ScreensInterface[] = [
            { Name: 'Recepcion', Screen: 'RecepcionMBScreen', image: require('../../assets/Recibir.png') },
            { Name: 'Despacho', Screen: 'DespachosMB', image: require('../../assets/Transferir.png') },
           
        ]
        console.log(usuairoValido.data);
        if(usuairoValido.data === true){
            tmp.push({ Name: 'Reimpresión Etiquetas', Screen: 'ReimpresionEtiquetasScreen', image: require('../../assets/ReimpresionEtiquetas.png') })
        }
        setData(tmp)
    }

    const renderItem = (item: ScreensInterface) => {
        return (
            <View style={{ width: '50%', alignItems: 'center' }}>
                <View style={{ width: '95%', borderWidth: 1, alignItems: 'center', borderRadius: 15, paddingVertical: 5, marginTop: 5 }}>
                    <TouchableOpacity onPress={() => navigation.navigate(item.Screen)}>
                        <Image
                            source={item.image}
                            style={{ width: 100, height: 100, resizeMode: 'contain' , alignSelf:'center'}}
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
            <Header texto1='' texto2='Menu Despacho PT' texto3='' />
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
