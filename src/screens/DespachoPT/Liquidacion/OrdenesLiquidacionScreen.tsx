import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View, processColor } from 'react-native';
import { RootStackParams } from '../../../navigation/navigation'
import { OrdenesLiquidacionInterface } from '../../../interfaces/DespachoPT/Liquidacion/OrdenesLiquidacionInterface'
import { WmSApi } from '../../../api/WMSApi'
import { WMSContext } from '../../../context/WMSContext'
import Header from '../../../components/Header'
import { blue, grey } from '../../../constants/Colors'

type props = StackScreenProps<RootStackParams, "OrdenesLiquidacionScreen">

export const OrdenesLiquidacionScreen: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<OrdenesLiquidacionInterface[]>([])
    const { WMSState, changeProdID } = useContext(WMSContext)
    const [cargando, setCargando] = useState<Boolean>(false)

    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<OrdenesLiquidacionInterface[]>(`OrdenesRecibidasDespachoLiquidacion/${WMSState.DespachoID}`)
                .then(resp => {
                    setData(resp.data)
                })
        } catch (err) {
            console.log(err)
        }
        setCargando(false)
    }

    const renderItem = (item: OrdenesLiquidacionInterface) => {
        return (
            <View style={{ width: '49%', alignItems: 'center' }}>
                <View style={{ backgroundColor: grey, width: '95%', borderRadius: 10, margin: 2, padding: 5, borderWidth: 2, borderColor: blue }} >
                    <TouchableOpacity style={{ width: '100%', alignItems: 'center' }} onPress={() => {
                        changeProdID(item.prodCutSheetID)
                        navigation.navigate('DestalleOrdenLiquidacionScreen')
                    }}>
                        <Text>{item.prodCutSheetID}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    useEffect(() => {
        getData();
    }, [])
    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1={`Despacho: ${WMSState.DespachoID}`} texto2='Ordenes Liquidacion' texto3='' />
            <View style={{ flex: 1, width: '100%' }}>
                {
                    cargando ?
                        <ActivityIndicator size={30} />
                        :
                        <FlatList
                            data={data}
                            keyExtractor={(item) => item.prodCutSheetID.toString()}
                            renderItem={({ item, index }) => renderItem(item)}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                            }
                            numColumns={2}
                        />
                }
            </View>
        </View>
    )
}
