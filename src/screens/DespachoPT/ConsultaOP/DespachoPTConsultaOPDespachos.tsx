import React, { FC, useContext, useEffect, useState } from 'react'
import { DespachosPTInterface } from '../../../interfaces/DespachoPT/Packing/DespachosPTInterface'
import { WMSContext } from '../../../context/WMSContext'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View, processColor } from 'react-native'
import Header from '../../../components/Header'
import { WmSApi } from '../../../api/WMSApi'
import { black, blue, grey } from '../../../constants/Colors'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../../navigation/navigation'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { ConsultaOPOrdenesInterface } from '../../../interfaces/DespachoPT/ConsultaOP/ConsultaOPDetalleInterface'


type props = StackScreenProps<RootStackParams, "DespachoPTConsultaOPDespachos">

export const DespachoPTConsultaOPDespachos: FC<props> = ({ navigation }) => {

    const [Data, setdata] = useState<ConsultaOPOrdenesInterface[]>([])
    const { changeProdID, WMSState } = useContext(WMSContext)
    const [despachoID, setDepachoID] = useState<string>('')
    const [ProdCutSheetID, setProdCutSheetID] = useState<string>('')

    const [cargando, setCargando] = useState<boolean>(false);
    const getData = async () => {
        try {
            await WmSApi.get<ConsultaOPOrdenesInterface[]>(`DespachosPTConsultaOrdenes/${(ProdCutSheetID.length > 0 ? ProdCutSheetID : 0)}/${(despachoID.length > 0 ? despachoID : 0)}`).then(resp => {
                setdata(resp.data)
            })
        } catch (err) {

        }
    }

    const renderItem = (item: ConsultaOPOrdenesInterface) => {
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ backgroundColor: grey, width: '95%', borderRadius: 10, margin: 2, padding: 5, borderWidth: 2, borderColor: blue }} >
                    <TouchableOpacity style={{ width: '100%' }} onPress={() => {
                        changeProdID(item.prodCutSheetID)
                        navigation.navigate('DespachoPTConsultaOPDetalle')
                    }}>
                        <Text>Despacho: {item.despachoID.toString().padStart(8, '0')}</Text>
                        <Text>Orden: {item.prodCutSheetID}</Text>
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
            <Header texto1='' texto2='Despacho PT Recibir' texto3='' />
            <View style={[style.textInput, { borderColor: '#77D970' }]}>
                <TextInput
                    onChangeText={(value) => { setProdCutSheetID(value) }}
                    value={ProdCutSheetID}
                    style={style.input}
                    placeholder='Orden'
                    autoFocus

                />
                {!cargando ?
                    <TouchableOpacity onPress={() => getData()}>
                        <Icon name='search' size={15} color={black} />
                    </TouchableOpacity>
                    :
                    <ActivityIndicator size={20} />
                }
            </View>
            <View style={[style.textInput, { borderColor: '#77D970' }]}>
                <TextInput
                    onChangeText={(value) => { setDepachoID(value) }}
                    value={despachoID}
                    style={style.input}
                    placeholder='Despacho'
                    autoFocus

                />

            </View>
            <View style={{ width: '100%',flex:1 }}>
                <FlatList
                    data={Data}
                    keyExtractor={(item) => item.prodCutSheetID.toString()}
                    renderItem={({ item, index }) => renderItem(item)}
                    refreshControl={
                        <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                    }
                    ListEmptyComponent={() => (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text >No se encontraron ordenes</Text>
                        </View>
                    )
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
