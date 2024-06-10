import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { RootStackParams } from '../../../navigation/navigation'
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import Header from '../../../components/Header'
import { blue, grey } from '../../../constants/Colors'
import { DespachosPTInterface } from '../../../interfaces/DespachoPT/Packing/DespachosPTInterface'
import { WmSApi } from '../../../api/WMSApi'
import { WMSContext } from '../../../context/WMSContext'

type props = StackScreenProps<RootStackParams, "DespachoPTAuditoria">

export const DespachoPTAuditoria: FC<props> = ({ navigation }) => {
    const [data, setdata] = useState<DespachosPTInterface[]>([])
    const { changeDespachoID, changeCamion, changeChofer, WMSState } = useContext(WMSContext)


    const getData = async () => {
        try {
            await WmSApi.get<DespachosPTInterface[]>('DespachoPTEstado/Recibido').then(resp => {
                setdata(resp.data)
            })
        } catch (err) {

        }
    }

    const renderItem = (item: DespachosPTInterface) => {
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ backgroundColor: grey, width: '95%', borderRadius: 10, margin: 2, borderWidth: 2, borderColor: blue }} >
                    <TouchableOpacity style={{ width: '100%' }} onPress={() => {
                        changeDespachoID(item.id)
                        changeCamion(item.truck)
                        changeChofer(item.driver)
                        navigation.navigate('DespachoPTAuditoriaCajas')
                    }}>
                        <Text>Despacho: {item.id.toString().padStart(8, '0')}</Text>
                        <Text>Motorista: {item.driver} / {item.truck}</Text>
                        <Text>Fecha: {item.createdDateTime.toString()}</Text>
                    </TouchableOpacity>

                </View>
            </View>
        )
    }

    useEffect(() => {
        getData()
    }, [])
    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='' texto2='Despacho PT Auditoria' texto3='' />
            <View style = {{ flex:1,width:'100%'}}>
            <FlatList
                data={data}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => renderItem(item)}
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                }
            />
            </View>
        </View>
    )
}
