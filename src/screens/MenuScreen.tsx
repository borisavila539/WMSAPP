import React, { FC, useEffect, useState } from 'react'
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { ScreensInterface } from '../interfaces/ScreeensInterface'
import { SeleccionarDiarioScreen } from './SeleccionarDiarioScreen'
import { RootStackParams } from '../navigation/navigation'
import { StackScreenProps } from '@react-navigation/stack'
import { grey, navy } from '../constants/Colors'
import Header from '../components/Header'

type props = StackScreenProps<RootStackParams, "MenuScreen">
export const MenuScreen: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<ScreensInterface[]>([])

    const setScreens = () => {
        let tmp: ScreensInterface[] = [
            { Name: 'Diarios de Salida', Screen: 'SeleccionarDiarioScreen', image: require('../assets/RegistroRegalias.png') },
            { Name: 'Despacho Tela', Screen: 'Seleccionartraslados', image: require('../assets/PreparacionTela.png') }

        ]
        setData(tmp)
    }

    const renderItem = (item: ScreensInterface) => {
        return (
            <View style={{ width: '50%', alignItems: 'center' }}>
                <View style={{ width: '95%', borderWidth: 1, alignItems: 'center', borderRadius: 15, paddingVertical: 5, marginTop: 5 }}>
                    <TouchableOpacity onPress={() => navigation.navigate(item.Screen)}>
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
            <Header texto1='' texto2='Menu' texto3=''/>
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
