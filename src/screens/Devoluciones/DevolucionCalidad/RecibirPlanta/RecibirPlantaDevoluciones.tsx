import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { RootStackParams } from '../../../../navigation/navigation'
import { Alert, Text, View, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native'
import { black, grey } from '../../../../constants/Colors'
import Header from '../../../../components/Header'
import { DevolucionesInterface } from '../../../../interfaces/Devoluciones/Devoluciones'
import { WmSApi } from '../../../../api/WMSApi'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { WMSContext, WMSState } from '../../../../context/WMSContext';


type props = StackScreenProps<RootStackParams, "RecibirPlantaDevoluciones">
export const RecibirPlantaDevoluciones: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<DevolucionesInterface[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const [filtro, setFiltro] = useState<string>('')
    const [page, setpage] = useState<number>(1)
    const [loadMore, setLoadMore] = useState<boolean>(true)
    const {changeDevolucion} = useContext(WMSContext)

    const getData = async (tipo: string) => {
        if (!cargando) {
            setCargando(true)
            try {
                await WmSApi.get<DevolucionesInterface[]>(`Devolucion/${filtro == '' ? '-' : filtro}/${tipo == '+' ? page + 1 : 1}/30/1`).then(resp => {
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

    const onPress =(item:DevolucionesInterface)=>{
        changeDevolucion(item)
        navigation.navigate('RecibirPlantaDevolucionesDetalle')
    }

    const renderItem = (item: DevolucionesInterface) => {
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => onPress(item)} style={{ width: '100%', borderWidth: 1, borderRadius: 15, paddingVertical: 5, paddingHorizontal: 10, marginTop: 5 }} >
                    <Text style={style.textRender}>Devolucion: {item.numDevolucion}</Text>
                    <Text>Fecha Solicitud: {item.fechaCrea.toString()}</Text>
                    <Text>Asesor: {item.asesor}</Text>
                    {
                        item.numeroRMA &&
                        <>
                            <Text>RMA: {item.numeroRMA}</Text>
                            <Text>Fecha AX: {item.fechaCreacionAX.toString()}</Text>
                        </>
                    }
                    <Text>Unidades: {item.totalUnidades}</Text>

                </TouchableOpacity>
            </View>
        )
    }

    useEffect(() => {
        getData('=')
    }, [])



    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='Devoluciones' texto2='Recibir Planta' texto3='' />
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
