import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { ScreensInterface } from '../../interfaces/ScreeensInterface';
import { RootStackParams } from '../../navigation/navigation';
import Header from '../../components/Header';
import { grey, navy } from '../../constants/Colors';

type props = StackScreenProps<RootStackParams, "ReceptionTelaMenu">
export const ReceptionTelaMenu: FC<props> = ({ navigation }) => {
  const [data, setData] = useState<ScreensInterface[]>([])

    const setScreens = () => {
        let tmp: ScreensInterface[] = [
            { Name: 'Tela por codigo', Screen: 'ReceptionTelaVendroll', image: require('../../assets/RecTelaVendroll.png') },
            { Name: 'Diario de Tela', Screen: 'ReceptionTelaScreen', image: require('../../assets/DiarioRecTela.png') },
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
            <Header texto1='' texto2='Menu Recepcion Tela' texto3='' />
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
