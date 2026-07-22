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
         
            {Name: 'Diarios', Screen: 'DiariosModuleScreen', image: require('../assets/Diarios.png') },      
            { Name: 'Empaque y Despacho', Screen: 'EmpaqueYDespachoScreen', image: require('../assets/EmpaqueYDespacho.png') },
            { Name: 'Recepción y Ubicación', Screen: 'MenuRecepcionYUbiacionScreen', image: require('../assets/AuditoriaImagen.png') },
            { Name: 'Tela', Screen: 'TelaModuleScreen', image: require('../assets/DespachoTela.jpg')},
            { Name: 'Devoluciones', Screen: 'MenuPrincipalDevolucion', image: require('../assets/Devolucion.png') },            
            { Name: 'Guias de Transporte', Screen: 'GuiasTrasportesScreen', image: require('../assets/GuiaTransporte.png') },            
            { Name: 'Gestion Serigrafia', Screen: 'MenuGestionSerigrafiaScreen', image: require('../assets/SerigrafiaPng.png') },      
            { Name: 'Diseño e Impresión de Etiquetas', Screen: 'DiseñoEtiquetasEImpresionModule', image: require('../assets/ModuloDiseñoEtiqueta.png') },   

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
                            style={{ width: item.Name == 'Diseño e Impresión de Etiquetas' ? 190 : 100, height: 120, resizeMode: 'contain' }}
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
