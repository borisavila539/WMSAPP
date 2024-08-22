import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { RootStackParams } from '../../../navigation/navigation'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Header from '../../../components/Header'
import { black, blue, grey } from '../../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { DespachoRecibidoLiquidacionInterface } from '../../../interfaces/DespachoPT/Liquidacion/DespachoRecibidoLiquidacionInterface'
import { WMSContext } from '../../../context/WMSContext'
import { WmSApi } from '../../../api/WMSApi'

type props = StackScreenProps<RootStackParams, "DespachoRecibidoLiquidacionScreen">

export const DespachoRecibidoLiquidacionScreen: FC<props> = ({ navigation }) => {
    const [DespachoID, setDespachoID] = useState<string>('')
    const [cargando, setCargando] = useState<boolean>(false);
    const [data, setData] = useState<DespachoRecibidoLiquidacionInterface[]>([])
    const { changeDespachoID, changeCamion, changeChofer, WMSState } = useContext(WMSContext)

    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<DespachoRecibidoLiquidacionInterface[]>(`DespachoRecibidoLiquidacion/${DespachoID != '' ? DespachoID : 0}`).then((resp) => { //Colocar almacen
                setData(resp.data)
                
            })
        } catch (err) {

        }
        setCargando(false)
    }


    const renderItem = (item: DespachoRecibidoLiquidacionInterface) => {
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ backgroundColor: grey, width: '95%', borderRadius: 10, margin: 2, padding: 5, borderWidth: 2, borderColor: blue }} >
                    <TouchableOpacity style={{ width: '100%' }} onPress={() => {
                        changeDespachoID(item.id)
                        navigation.navigate('OrdenesLiquidacionScreen')
                    }}>
                        <Text>Despacho: {item.id.toString().padStart(8, '0')}</Text>
                        <Text>Almacen: {item.almacen}</Text>
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
            <Header texto1='' texto2='Desapcho Liquidacion' texto3='' />
            <View style={[style.textInput, { borderColor: '#77D970' }]}>
                <TextInput
                    onChangeText={(value) => { setDespachoID(value) }}
                    value={DespachoID}
                    style={style.input}
                    placeholder='#Despacho'

                />
                {!cargando ?
                    <TouchableOpacity onPress={getData}>
                        <Icon name='search' size={15} color={black} />
                    </TouchableOpacity>
                    :
                    <ActivityIndicator size={20} />
                }
            </View>
            <View style={{ flex: 1, width: '100%' }}>
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item, index }) => renderItem(item)}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                    }
                />
            </View>
        </View>
    )
}

const style = StyleSheet.create({
    textInput: {
        maxWidth: 450,
        width: '95%',
        backgroundColor: grey,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 5,
        borderWidth: 2
    },
    input: {
        width: '90%',
        textAlign: 'center'
    },
    textRender: {
        color: grey
    }
})
