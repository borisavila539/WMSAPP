import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useCallback, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View, processColor } from 'react-native';
import { RootStackParams } from '../../../navigation/navigation'
import { BuscarVendPackingSlipJourInterface, OrdenesLiquidacionInterface } from '../../../interfaces/DespachoPT/Liquidacion/OrdenesLiquidacionInterface'
import { WmSApi } from '../../../api/WMSApi'
import { WMSContext } from '../../../context/WMSContext'
import Header from '../../../components/Header'
import { blue, grey, green } from '../../../constants/Colors'
import { useFocusEffect } from '@react-navigation/native';

type props = StackScreenProps<RootStackParams, "OrdenesLiquidacionScreen">



export const OrdenesLiquidacionScreen: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<OrdenesLiquidacionInterface[]>([])
    const { WMSState, changeProdID, changePurchId, changeNumeroOPPakingList, changeTieneDiarioRecepcion } = useContext(WMSContext)
    const [cargando, setCargando] = useState<Boolean>(false)
    const [dataExistenciaPL, setDataExistenciaPL] = useState<BuscarVendPackingSlipJourInterface[]>([])
    const [maxPl, setMaxPl] = useState<number>(0);
    const secuencia = data[0]?.numeroOPPakingList.split('-')[1];
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

    const getExistenciaPL = async () => {
        try {
            const resp = await WmSApi.get<BuscarVendPackingSlipJourInterface[]>(
                `BuscarVendPackingSlipJour/${secuencia}/${data[0]?.vendAccount}`
            )

            setDataExistenciaPL(resp.data)

            const maxPls = resp.data.reduce((max, item: any) => {
                const valor = item?.packingslipid ?? item?.packingSlipId

                if (typeof valor !== 'string') return max

                const match = valor.trim().toUpperCase().match(/^PL-\d+-(\d+)/)
                if (!match) return max

                const numero = Number(match[1])
                return !isNaN(numero) ? Math.max(max, numero) : max
            }, 0)

            setMaxPl(maxPls)
        } catch (err) {
            console.log(err)
        }
    }

    const renderItem = (item: OrdenesLiquidacionInterface) => {
        const estaRecepcionado = Number(item.tieneDiarioRecepcion) === 1;
        const secuencia =
            item.numeroOPPakingList?.split('-')[1] ??
            data[0]?.numeroOPPakingList?.split('-')[1]

        const plSivieneNull = `PL-${secuencia}-${maxPl + 1}`
        const PLToSend = item.numeroOPPakingList === null ? plSivieneNull : item.numeroOPPakingList

        return (
            <View style={{ width: '49%', alignItems: 'center' }}>
                <View style={{ backgroundColor: grey, width: '95%', borderRadius: 10, margin: 2, padding: 10, borderWidth: 2, borderColor: blue }} >
                    <TouchableOpacity style={{ width: '100%', alignItems: 'center' }} onPress={() => {
                        changeProdID(item.prodCutSheetID)
                        changePurchId(item.purchId)
                        getExistenciaPL()
                        changeNumeroOPPakingList(PLToSend)
                        changeTieneDiarioRecepcion(item.tieneDiarioRecepcion)
                        navigation.navigate('DestalleOrdenLiquidacionScreen')
                    }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{item.prodCutSheetID}</Text>
                        <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{item.purchId}</Text>
                        <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>PL: {PLToSend}</Text>
                        <View style={{
                            marginTop: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 5,
                            backgroundColor: estaRecepcionado ? green : '#FFA500'
                        }}>
                            <Text style={{ fontSize: 10, color: 'white', fontWeight: '600' }}>
                                {estaRecepcionado ? 'Recepcionado' : 'Sin Recepcionar'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
    useFocusEffect(
        useCallback(() => {
            getData()
        }, [])
    )

    useEffect(() => {
        getData()
    }, [])

    useEffect(() => {
        if (data.length > 0) {
            getExistenciaPL()
        }
    }, [data])


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
