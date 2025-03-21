import React, { FC, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import Header from '../../../components/Header'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../../navigation/navigation'
import { WMSApiMB } from '../../../api/WMSApiMB'
import { DespachoMBInterface } from '../../../interfaces/RecepcionMB/RecepcionMB'
import { blue, grey } from '../../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { WMSContext } from '../../../context/WMSContext'

type props = StackScreenProps<RootStackParams, "DespachosMB">
export const DespachosMB: FC<props> = ({ navigation }) => {

    const [cargando, setCargando] = useState<boolean>(false)
    const [data, setData] = useState<DespachoMBInterface[]>([])
    const { changeDespachoID } = useContext(WMSContext)

    const getData = async () => {
        if (!cargando) {
            setCargando(true)
            try {
                await WMSApiMB.get<DespachoMBInterface[]>('DespachosPendientes')
                    .then(resp => {
                        setData(resp.data)
                    })
            } catch (err) {
                console.log(err)
            }
            setCargando(false)

        }
    }

    const onPress = (item: DespachoMBInterface) => {
        changeDespachoID(item.id)
        navigation.navigate('MenuDespachoMB')
    }

    const renderItem = (item: DespachoMBInterface) => {

        return (
            <View style={{ width: '100%', alignItems: 'center', marginBottom: 5 }}>

                <TouchableOpacity onPress={() => onPress(item)} style={
                    {
                        width: '95%',
                        borderRadius: 15,
                        padding: 10,
                        backgroundColor: blue,
                        flexDirection: 'row',
                        alignItems: 'center'
                    }
                }>
                    <View style={{ width: '85%', alignItems: 'center' }}>
                        <Text style={{ color: grey, fontWeight: 'bold' }}>Despacho: {item.id} </Text>
                        <Text style={{ color: grey, fontWeight: 'bold' }}>Fecha{item.fechaCreacion.toString()}</Text>
                    </View>
                    <View style={{ width: '15%' }}>
                        <Icon name='boxes' size={25} color={grey} />
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    useEffect(() => {
        getData()
    }, [])
    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>

            <Header texto1='Despachos MB' texto2='' texto3='' />
            <View style={{ flex: 1, width: '100%' }}>
                {
                    cargando ?
                        <ActivityIndicator size={20} />
                        :
                        <FlatList
                            data={data}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item, index }) => renderItem(item)}
                            refreshControl={
                                <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                            }
                        />
                }


            </View>
        </View>
    )
}
