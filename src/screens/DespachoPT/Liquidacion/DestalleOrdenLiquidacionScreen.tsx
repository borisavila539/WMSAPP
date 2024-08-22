import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { RootStackParams } from '../../../navigation/navigation'
import Header from '../../../components/Header'
import { WMSContext } from '../../../context/WMSContext'
import { blue, green, grey } from '../../../constants/Colors'
import { DetalleOrdenLiquidacionInterface, DetalleOrdenLiquidacionInterfacegroup } from '../../../interfaces/DespachoPT/Liquidacion/OrdenesLiquidacionInterface';
import { WmSApi } from '../../../api/WMSApi'


type props = StackScreenProps<RootStackParams, "DestalleOrdenLiquidacionScreen">

export const DestalleOrdenLiquidacionScreen: FC<props> = ({ navigation }) => {
    const { WMSState } = useContext(WMSContext)
    const [data, setData] = useState<DetalleOrdenLiquidacionInterface[]>([])
    const [cargando, setCargando] = useState<Boolean>(false)

    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<DetalleOrdenLiquidacionInterface[]>(`DetalleOrdenesRecibidasliquidacion/${WMSState.DespachoID}/${WMSState.ProdID}`)
                .then(resp => {

                    setData(resp.data)
                })
        } catch (err) {

        }
        setCargando(false)
    }

    const renderItemDetalle = (texto: string, qty: number) => {
        return (
            <View style={{ width: '33%' }}>
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <Text>{texto}</Text>
                </View>
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <Text>{qty}</Text>
                </View>
            </View>
        )
    }

    const renderItem = (item: DetalleOrdenLiquidacionInterface) => {
        const getPL = (): string => {
            let num = parseInt(item.prodCutSheetID.substring(3, 11))
            let version = parseInt(item.prodCutSheetID.substring(13, 15))
            return `PL-${item.secuencia}-${num}-${version}-${item.numero}`
        }
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ backgroundColor: grey, width: '95%', borderRadius: 10, margin: 2, padding: 5, borderWidth: 2, borderColor: blue }} >
                    <View style={{ width: '100%', flexDirection: 'row' }}>

                        <Text style={{ width: '20%', fontWeight: 'bold' }}>{`Talla: ${item.size}`}</Text>
                        <Text style={{ width: '46%', textAlign: 'center', fontWeight: 'bold' }}>
                            {getPL()}
                        </Text>
                        <TouchableOpacity style={{ width: '33%', backgroundColor: green, borderRadius: 10, paddingVertical: 7 }}>
                            <Text style={{ textAlign: 'center', fontWeight: 'bold', color: grey }}>Liquidar</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ width: '100%', flexDirection: 'row' }}>
                        {
                            renderItemDetalle('Enviado', item.enviado)

                        }
                        {
                            renderItemDetalle('Recibido', item.recibido)
                        }
                        {
                            renderItemDetalle('Diferencia', item.enviado - item.recibido)
                        }
                    </View>
                </View>
            </View>
        )
    }

    useEffect(() => {
        getData();
    }, [])

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1={`Despacho: ${WMSState.DespachoID}`} texto2={`Orden: ${WMSState.ProdID}`} texto3='' />
            <View style={{ flex: 1, width: '100%' }}>

                {
                    cargando ?
                        <ActivityIndicator />
                        :
                        <FlatList
                            data={data}
                            keyExtractor={(item, index) => item.prodID}
                            renderItem={({ item }) => renderItem(item)}
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


