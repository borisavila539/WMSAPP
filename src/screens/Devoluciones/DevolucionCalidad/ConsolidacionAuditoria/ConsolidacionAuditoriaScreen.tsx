

import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { RootStackParams } from '../../../../navigation/navigation'
import { Alert, Text, View, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native'
import { black, green, grey } from '../../../../constants/Colors'
import Header from '../../../../components/Header'
import { ConsolidacionCajas, DevolucionesInterface } from '../../../../interfaces/Devoluciones/Devoluciones'
import { WmSApi } from '../../../../api/WMSApi'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { WMSContext } from '../../../../context/WMSContext'



type props = StackScreenProps<RootStackParams, "ConsolidacionAuditoriaScreen">
export const ConsolidacionAuditoriaScreen: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<DevolucionesInterface[]>([])
    const [mostrar, setMostrar] = useState<DevolucionesInterface[]>([])
    const [consolidar, setConsolidar] = useState<DevolucionesInterface[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const [filtro, setFiltro] = useState<string>('')
    const { WMSState } = useContext(WMSContext)

    const getData = async () => {
        if (!cargando) {
            setCargando(true)
            try {
                await WmSApi.get<DevolucionesInterface[]>(`Devolucion/Consolidada`).then(resp => {
                    setData(resp.data)
                    setMostrar(resp.data)
                })
            } catch (ex) {
                Alert.alert('Error')
            }
            setCargando(false)
        }
    }

    const onPress = (item: DevolucionesInterface, tipo: boolean) => {
        if (!tipo) {
            if (!consolidar.find(x => x.id == item.id)) {
                setConsolidar(consolidar.concat(item))
            }
        } else {
            setConsolidar(consolidar.filter(x => x.id != item.id))
        }

    }

    const renderItem = (item: DevolucionesInterface, tipo: boolean) => {
        return (
            <View style={{ width: '90%', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => onPress(item, tipo)} style={{ width: '100%', borderRadius: 15, paddingVertical: 5, paddingHorizontal: 10, marginTop: 5, backgroundColor: !tipo ? '#FF5722' : '#176B87' }} >
                    <Text style={style.textRender}>{item.numDevolucion}</Text>

                    <Text style={style.textRender}>{item.asesor}</Text>
                    {
                        item.numeroRMA &&
                        <>
                            <Text style={style.textRender}>{item.numeroRMA}</Text>
                        </>
                    }
                    <Text style={style.textRender}>Unidades: {item.totalUnidades}</Text>
                </TouchableOpacity>
            </View>
        )
    }

    const ConsolidarCaja = async () => {
        if (!cargando) {
            try {
                let enviar: ConsolidacionCajas[] = []
                consolidar.forEach(element => {
                    let tmp: ConsolidacionCajas = { usuario: WMSState.usuario, numDevolucion: element.numDevolucion };
                    enviar.push(tmp)

                })
                await WmSApi.post<ConsolidacionCajas[]>('Devolucion/ConsolidacionCajas', enviar).then(resp => {
                    navigation.goBack()
                })
            } catch (err) {
                Alert.alert('err')
            }
        }
    }

    useEffect(() => {
        getData()
    }, [])



    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='Devoluciones' texto2='Auditoria' texto3='' />
            <View style={[style.textInput, { borderColor: '#77D970' }]}>
                <TextInput
                    onChangeText={(value) => { setFiltro(value) }}
                    value={filtro}
                    style={style.input}
                    placeholder='Orden'
                    autoFocus
                />
                {!cargando ?
                    <TouchableOpacity onPress={() => setMostrar(data.filter(x => (x.numDevolucion.includes(filtro) || filtro == '')))}>
                        <Icon name='search' size={15} color={black} />
                    </TouchableOpacity>
                    :
                    <ActivityIndicator size={20} />
                }
            </View>
            {
                consolidar.length > 1 &&
                <TouchableOpacity onPress={ConsolidarCaja} style={{ backgroundColor: green, width: '85%', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10, marginTop: 5, alignItems: 'center' }}>
                    <Text style={style.textRender}>CONSOLIDAR</Text>
                </TouchableOpacity>
            }


            <View style={{ width: '100%', flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>

                    <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>Sin consolidar</Text>
                    <FlatList
                        data={mostrar.filter(x => !consolidar.find(y => y.numDevolucion == x.numDevolucion))}
                        keyExtractor={(item) => item.numDevolucion.toString()}
                        renderItem={({ item, index }) => renderItem(item, false)}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>A consolidar</Text>
                    <FlatList
                        data={consolidar}
                        keyExtractor={(item) => item.numDevolucion.toString()}
                        renderItem={({ item, index }) => renderItem(item, true)}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
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
        fontWeight: 'bold',
        color: '#fff'

    }
})

