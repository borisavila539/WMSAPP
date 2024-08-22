import React, { FC, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import Header from '../../components/Header';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParams } from '../../navigation/navigation';
import { InventarioCiclicotelaDiariosAbiertos } from '../../interfaces/InventarioCiclicoTela/InventarioCiclicotelaDiariosAbiertos';
import { WmSApi } from '../../api/WMSApi';
import { blue, grey } from '../../constants/Colors';
import { WMSContext } from '../../context/WMSContext';
type props = StackScreenProps<RootStackParams, "DiariosinventarioCiclicoTelaScreen">

export const DiariosinventarioCiclicoTelaScreen: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<InventarioCiclicotelaDiariosAbiertos[]>([])
    const [cargando, setCargando] = useState<Boolean>(false)
    const { changeDiario } = useContext(WMSContext)

    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<InventarioCiclicotelaDiariosAbiertos[]>('InventarioCiclicoTelasDiariosAbiertos')
                .then(resp => {
                    setData(resp.data)
                })
        } catch (err) {

        }
        setCargando(false)
    }

    const renderItem = (item: InventarioCiclicotelaDiariosAbiertos) => {
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ backgroundColor: grey, width: '95%', borderRadius: 10, margin: 2, padding: 5, borderWidth: 2, borderColor: blue }} >
                    <TouchableOpacity style={{ width: '100%' }} onPress={() => {
                        changeDiario(item.journalid)
                        navigation.navigate('DetalleInventarioCliclicoTelaScreen')
                    }}>
                        <Text>Diario: {item.journalid}</Text>
                        <Text>Tipo: {item.journalnameid}</Text>
                        <Text>Descripcion: {item.description}</Text>
                    </TouchableOpacity>

                </View>
            </View>
        )
    }

    useEffect(() => {
        getData();
    }, [])
    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey }}>
            <Header texto1='' texto2='Ciclico Tela' texto3='' />
            <View style={{ flex: 1, width: '100%' }}>
                {
                    cargando ?
                        <ActivityIndicator size={20} />
                        :
                        <FlatList
                            data={data}
                            keyExtractor={(item) => item.journalid}
                            renderItem={({ item, index }) => renderItem(item)}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                            }
                        />
                }

            </View>
        </View>

    )
}
