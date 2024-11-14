import React, { FC, useContext, useEffect, useState } from 'react'
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import Header from '../../components/Header'
import { grey, navy } from '../../constants/Colors'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../navigation/navigation'
import { ScreensInterface } from '../../interfaces/ScreeensInterface'
import { WMSContext } from '../../context/WMSContext'

type props = StackScreenProps<RootStackParams, "ReciclajeCajasScreen">
export const ReciclajeCajasScreen: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<ScreensInterface[]>([])
    const { WMSState } = useContext(WMSContext)
    const setScreens = () => {
        let tmp: ScreensInterface[] = [
            { Name: 'Enviar', Screen: 'EnviarReciclajeCajaScreen', image: require('../../assets/EnviarReciclajeCaja.png') },
        ]

        if (WMSState.usuarioAlmacen == 2) {
            tmp =
                [
                    ...tmp,
                    { Name: 'Recibir', Screen: 'RecibirReciclajeCajasScreen', image: require('../../assets/RecibirReciclajeCaja.png') },
                ]
        }
        setData(tmp)
    }

    const renderItem = (item: ScreensInterface) => {
        return (
            <View style={{ width: '50%', alignItems: 'center' }}>
                <View style={{ width: '95%', borderWidth: 1, alignItems: 'center', borderRadius: 15, paddingVertical: 5, marginTop: 5 }}>
                    <TouchableOpacity onPress={() => navigation.navigate(item.Screen)} style={{ alignItems: 'center' }}>
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
            <Header texto1='' texto2='Menu Reciclaje Caja' texto3='' />
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
