import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useEffect, useState } from 'react'
import { RootStackParams } from '../../../../navigation/navigation'
import { DevolucionesInterface } from '../../../../interfaces/Devoluciones/Devoluciones'
import { WmSApi } from '../../../../api/WMSApi'
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { black, grey } from '../../../../constants/Colors'
import Header from '../../../../components/Header'
import Icon from 'react-native-vector-icons/FontAwesome5'


type props = StackScreenProps<RootStackParams, "TrackingDevolucion">
export const TrackingDevolucion: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<DevolucionesInterface[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const [filtro, setFiltro] = useState<string>('')
    const [page, setpage] = useState<number>(1)
    const [loadMore, setLoadMore] = useState<boolean>(true)

    const getData = async (tipo: string) => {
        if (!cargando) {
            setCargando(true)
            try {
                await WmSApi.get<DevolucionesInterface[]>(`Devolucion/Tracking/${filtro == '' ? '-' : filtro}/${tipo == '+' ? page + 1 : 1}/30`).then(resp => {
                    if (tipo == '+') {
                        setData(data.concat(resp.data))
                        setpage(page + 1)

                    } else {
                        setData(resp.data)
                        setpage(2)
                    }

                    if (resp.data.length < 30) {
                        setLoadMore(false)
                    } else {
                        setLoadMore(true)
                    }
                })
            } catch (ex) {
                Alert.alert('Error')
            }
            setCargando(false)
        }
    }

    const renderItem = (item: DevolucionesInterface) => {
        const getColor = (): string => {
            switch (item.descricpcion) {
                case 'Recibido en Planta':
                    return '#FFE61B';
                case 'Auditado':
                    return '#FFB72B';
                case 'Enviado a CD':
                    return '#40A2E3';
                case 'Recibido CD':
                    return '#8FD14F';
                case 'Rechazado':
                    return '#FF6600';
                default:
                    return '#D9D9D9';
            }
        }
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ width: '100%', backgroundColor: getColor(), borderWidth: 1, borderRadius: 15, paddingVertical: 5, paddingHorizontal: 10, marginTop: 5 }} >
                    <Text style={style.textRender}>Devolucion: {item.numDevolucion}</Text>
                    <Text>Asesor: {item.asesor}</Text>
                    <Text>RMA: {item.numeroRMA}</Text>
                    <Text>Estatus: {item.descricpcion}</Text>
                    <Text>Unidades: {item.totalUnidades}</Text>
                </View>
            </View>
        )
    }

    useEffect(() => {
        getData('=')
    }, [])
    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='Devoluciones' texto2='Tracking' texto3='' />
            <View style={[style.textInput, { borderColor: '#77D970' }]}>
                <TextInput
                    onChangeText={(value) => { setFiltro(value) }}
                    value={filtro}
                    style={style.input}
                    placeholder='Orden'
                    autoFocus
                />
                {!cargando ?
                    <TouchableOpacity onPress={() => getData('=')}>
                        <Icon name='search' size={15} color={black} />
                    </TouchableOpacity>
                    :
                    <ActivityIndicator size={20} />
                }
            </View>
            <FlatList
                data={data}
                keyExtractor={(item) => item.numDevolucion.toString()}
                renderItem={({ item, index }) => renderItem(item)}
                showsVerticalScrollIndicator={false}
                onEndReached={() => loadMore ? getData('+') : null}
            />
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
        fontWeight: 'bold'

    }
})
