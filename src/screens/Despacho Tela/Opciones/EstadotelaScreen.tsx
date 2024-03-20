import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import {  View } from 'react-native'
import { Text } from 'react-native-elements'
import { RootStackParams } from '../../../navigation/navigation'
import Header from '../../../components/Header'
import { WMSContext } from '../../../context/WMSContext'
import { EstadoTelaInterface } from '../../../interfaces/EstadoTelaInterface';
import { ProgressBar } from '@react-native-community/progress-bar-android';
import { FlatList, RefreshControl } from 'react-native-gesture-handler'
import { grey } from '../../../constants/Colors'
import { WmSApi } from '../../../api/WMSApi'

type props = StackScreenProps<RootStackParams, "EstadotelaScreen">
export const EstadotelaScreen: FC<props> = ({ navigation }) => {
    const { WMSState } = useContext(WMSContext)
    const [data, setData] = useState<EstadoTelaInterface[]>([])
    const getData = async () => {
        try {
            await WmSApi.get<EstadoTelaInterface[]>(`EstadoTrasladoTipo/${WMSState.TRANSFERIDFROM}/${WMSState.TRANSFERIDTO}/${WMSState.INVENTLOCATIONIDTO}`).then(resp => {
                setData(resp.data)
            })
        } catch (err) {

        }
    }

    const renderItem = (item: EstadoTelaInterface) => {
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ backgroundColor: grey, width: '95%', borderRadius: 10, margin: 2, padding: 5, borderWidth: 1 }}>
                    <Text style={{textAlign:'center',fontWeight: 'bold'}}>{item.tipo}</Text>
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text>Picking </Text>
                        <ProgressBar
                            styleAttr='Horizontal'
                            indeterminate={false}
                            progress={item.picking / item.total}
                            style={{ width: '50%' }}
                            color='#6BCB77'
                        />
                        <Text>{item.picking}/{item.total}</Text>
                    </View>

                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text>Packing </Text>
                        <ProgressBar
                            styleAttr='Horizontal'
                            indeterminate={false}
                            progress={item.enviado / item.total}
                            style={{ width: '50%' }}
                            color='#6BCB77'
                        />
                        <Text>{item.enviado}/{item.total}</Text>
                    </View>

                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text>Recibido</Text>
                        <ProgressBar
                            styleAttr='Horizontal'
                            indeterminate={false}
                            progress={item.recibido / item.total}
                            style={{ width: '50%' }}
                            color='#6BCB77'
                        />
                        <Text>{item.recibido}/{item.total}</Text>
                    </View>

                </View>
            </View>
        )
    }


    useEffect(() => {
        getData()
    }, [])

    return (
        <View style={{ flex: 1, width: '100%' }}>
            <Header texto1={WMSState.TRANSFERIDFROM + '-' + WMSState.TRANSFERIDTO} texto2='Estado Tela' texto3='' />
            <FlatList
                data={data}
                keyExtractor={(item) => item.tipo}
                renderItem={({ item, index }) => renderItem(item)}
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                }
            />

        </View>
    )
}
