import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import { RootStackParams } from '../navigation/navigation'
import Header from '../components/Header'

import { WMSContext } from '../context/WMSContext'
import { WmSApi } from '../api/WMSApi'
import { RollosDespachoInterface } from '../interfaces/RollosDespachoInterface'
import { RefreshControl } from 'react-native-gesture-handler';
import { blue, grey } from '../constants/Colors'


type props = StackScreenProps<RootStackParams, "RollosDespachoScreen">

export const RollosDespachoScreen: FC<props> = ({ navigation }) => {
    const { WMSState } = useContext(WMSContext)
    const [data, setData] = useState<RollosDespachoInterface[]>([])

    const getData = async () => {
        try {
            await WmSApi.get<RollosDespachoInterface[]>(`RollosDespacho/${WMSState.DespachoID}`).then(resp => {
                setData(resp.data)
            })
        } catch (err) {
            console.log(err)
        }
    }
    const renderItem = (item: RollosDespachoInterface,index:number) => {
        return (
            <View style={{ width: '50%', alignItems: 'center' }}>
                <View style={{ margin:3,width: '90%', alignItems: 'center', borderRadius: 10,backgroundColor: blue }}>
                    <Text style={{color:grey, fontWeight: 'bold'}}>{index+1}: {item.inventserialid}</Text>
                </View>
            </View>

        )
    }

    useEffect(() => {
        getData()
    }, [])
    return (
        <View style={{ flex: 1, width: '100%' }}>
            <Header texto1={'Camion: ' + WMSState.Camion} texto2={'Camion: ' + WMSState.Chofer} texto3={'Total: '+data.length} />
            <FlatList
                data={data}
                numColumns={2}
                keyExtractor={(item) => item.id.toString()}                
                renderItem={({ item, index }) => renderItem(item,index)}
               
            />
        </View>
    )
}
