import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { RootStackParams } from '../../../../navigation/navigation'
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Header from '../../../../components/Header'
import { black, green, grey, navy, orange } from '../../../../constants/Colors'
import { WMSContext } from '../../../../context/WMSContext'
import { DevolucionDetalleinterface, DevolucionesInterface } from '../../../../interfaces/Devoluciones/Devoluciones';
import SoundPlayer from 'react-native-sound-player'
import { WmSApi } from '../../../../api/WMSApi'
import Icon from 'react-native-vector-icons/FontAwesome5'


type props = StackScreenProps<RootStackParams, "AuditoriaDevolucion_Detalle">
export const AuditoriaDevolucion_Detalle: FC<props> = ({ navigation }) => {
    const { WMSState, changeRecId } = useContext(WMSContext)
    const [data, setData] = useState<DevolucionDetalleinterface[]>([])
    const [itemBarcode, setItembarcode] = useState<string>('')
    const [enviandoEstado, setEnviandoEstado] = useState<boolean>(false)
    const [showModalPrint, setShowModalPrint] = useState<boolean>(false)
    const [cargando, setCargando] = useState<boolean>(false)
    const [Cajasprimeras, setCajasPrimeras] = useState<string>('')
    const [CajasIrregular, setCajasIrregular] = useState<string>('')
    const [imprimiendo, setImprimiendo] = useState<boolean>(false)
    const [id, setId] = useState<number>(0)

    const getData = async () => {
        if (!cargando) {
            setCargando(true)
            try {
                await WmSApi.get<DevolucionDetalleinterface[]>(`DevolucionDetalle/auditoria/${WMSState.devolucion.id}`)
                    .then(resp => {
                        setData(resp.data)
                    })
            } catch (err) {
                Alert.alert('err1')
            }
            setCargando(false)
        }
    }

    const ActualizarEstado = async (tipo: string) => {
        if (!enviandoEstado) {
            setEnviandoEstado(true)

            let cont: number = 0

            data.forEach(linea => {
                linea.defecto?.forEach(def => {
                    if (def.Defecto != '' || def.tipo == '') {
                        cont++;
                    }
                })
            })
            if (cont == 0) {
                try {
                    await WmSApi.get<DevolucionesInterface>(`Devolucion/Estado/${WMSState.devolucion.id}/${tipo}/${WMSState.usuario}/-`)
                        .then(resp => {
                            if (resp.data.descricpcion == tipo) {
                                PlaySound('success')
                                navigation.goBack()
                                navigation.goBack()

                            } else {
                                PlaySound('error')
                            }
                        })
                } catch (err) {

                }
            } else {
                PlaySound('error')
            }
            setEnviandoEstado(false)
        }

    }
    const imprimir = async () => {
        if (!imprimiendo) {
            setImprimiendo(true)
            try {
                await WmSApi.get<string>(`Devolucion/ImpresionEtiqueta/${WMSState.devolucion.id}/${WMSState.devolucion.numDevolucion}/${Cajasprimeras.length > 0 ? Cajasprimeras : '0'}/${CajasIrregular.length > 0 ? CajasIrregular : '0'}/${WMSState.usuario}`)
                    .then(resp => {
                        PlaySound('success')
                        setShowModalPrint(false)

                    })
            } catch (err) {

            }
            setImprimiendo(false)
        }
    }

    const renderItem = (item: DevolucionDetalleinterface, show: boolean) => {
        const getCantidad = (): number => {
            let cant: number = 0
            item.defecto?.forEach(element => {
                if (element.tipo) {
                    cant++;
                }
            })
            return cant
        }

        const getColor = (): string => {

            let cant = getCantidad()
            if ((cant / item.cantidad) == 0) {
                return '#FFE61B'
            } else if ((cant / item.cantidad) == 1) {

                return '#B5FE83'
            } else {
                return '#FFB72B'
            }
        }
        return (
            <View style={{ width: '100%', alignItems: 'center', marginBottom: 3 }}>

                <TouchableOpacity
                    disabled={show}
                    onPress={() => {
                        //setShowList(item.articulo)
                        setId(item.id)
                    }}
                    style={{ backgroundColor: getColor(), width: '90%', borderRadius: 15, paddingVertical: 5, paddingHorizontal: 10, marginTop: 5 }}
                >
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={style.textRender}>Articulo: {item.articulo}</Text>
                        <Text style={style.textRender}>{getCantidad()}/{item.cantidad}</Text>
                    </View>
                    {/*<Text style={style.textRender}>Cod. Barra: {item.itembarcode}</Text>*/}
                    <Text style={style.textRender}>Talla: {item.talla}</Text>
                    <Text style={style.textRender}>Color: {item.color}</Text>

                    <View style={{ maxHeight: 150, width: '100%' }}>
                        <ScrollView>
                            {
                                item.id == id && show &&
                                item.defecto?.map(element => (
                                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginTop: 1, borderRadius: 5 }}>
                                        <Text style={{ width: '5%', textAlign: 'center', fontWeight: 'bold' }}>{((item.defecto?.indexOf(element)) ?? 0) + 1}</Text>




                                        <View style={{ width: '85%', padding: 2, borderLeftWidth: 1 }}>
                                            {
                                                element.tipo &&
                                                <>
                                                    <Text> Area:{element.area}</Text>
                                                    <Text>Operacion:{element.operacion}</Text>
                                                    <Text>Defecto:{element.defecto}</Text>
                                                    <Text>Tipo:{element.tipo}</Text>
                                                    <Text>{element.reparacion ? 'Reparado' : 'No Reparado'}</Text>
                                                </>
                                            }
                                        </View>

                                        <TouchableOpacity onPress={() => {
                                            changeRecId(element.id.toString());
                                            navigation.navigate('AuditoriaDevolucionDefecto');
                                        }} style={{ height: 30, justifyContent: 'flex-end', width: '9%', flexDirection: 'row' }}>
                                            <View>
                                                <Icon name='edit' size={20} color={black} />
                                            </View>
                                        </TouchableOpacity>





                                    </View>
                                ))
                            }
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </View >
        )
    }

    const getTotalAuditado = (): number => {
        let cont: number = 0
        data.forEach(element => {
            element.defecto?.forEach(ele => {
                if (ele.defecto) {
                    cont++
                }
            })
        })

        return cont
    }


    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {

            getData();
        });

        return unsubscribe; // Limpia el listener al desmontar el componente
    }, [navigation, getData]);



    useEffect(() => {
        getData()
        //getDefectos()
    }, [])

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='Auditoria' texto2={WMSState.devolucion.numDevolucion}
                texto3={getTotalAuditado() + "/" + data.reduce((suma, devolucion) => suma + devolucion.cantidad, 0) + ''}
            />
            <View style={{ width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'space-evenly' }}>
                <TextInput
                    style={style.textInput}
                    onChangeText={(value) => {
                        /*setShowList(data.find(x => x.itembarcode == value)?.articulo ?? '')
                        setId(data.find(x => x.itembarcode == value)?.id ?? 0)*/
                    }}
                    value={itemBarcode}
                    autoFocus

                />
                <TouchableOpacity onPress={() => ActualizarEstado('Auditado')} disabled={enviandoEstado || (Cajasprimeras.length == 0 && CajasIrregular.length == 0)} style={{ backgroundColor: green, paddingVertical: 5, paddingHorizontal: 5, borderRadius: 10, width: '15%', height: '85%', alignItems: 'center' }}>
                    {
                        !enviandoEstado ?
                            <Icon name='check' size={35} color={black} />
                            :
                            <ActivityIndicator size={20} />
                    }
                </TouchableOpacity>
            </View>

            {
                getTotalAuditado() == data.reduce((suma, devolucion) => suma + devolucion.cantidad, 0) &&
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setShowModalPrint(true)} style={{ backgroundColor: orange, width: '85%', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10, marginTop: 5, alignItems: 'center' }}>
                        <Text style={[style.textRender, { color: grey }]}>IMPRIMIR</Text>
                    </TouchableOpacity>
                </View>
            }


            {
                cargando ?
                    <ActivityIndicator size={20} />
                    :
                    null
            }

            {
                data.find(x => x.id == id)?.id != null ?
                    renderItem(data.find(x => x.id == id), true)
                    :
                    null
            }
            <FlatList
                data={data}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => renderItem(item, false)}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                }
            />
            <Modal visible={showModalPrint} transparent={true}>
                <View style={style.modal}>
                    <View style={style.constainer}>
                        <Text style={style.text}>
                            Cajas
                        </Text>

                        <Text>
                            <Icon name={'exclamation-triangle'} size={80} color={'#FFB72B'} />
                        </Text>
                        <View style={{ width: '100%', justifyContent: 'space-between', flexDirection: 'row' }}>
                            <View style={{ width: '50%', alignItems: 'center' }}>
                                <Text style={style.text}>Primeras</Text>
                                <TextInput
                                    style={[style.textInput, { width: '90%' }]}
                                    onChangeText={(value) => {
                                        setCajasPrimeras(value)
                                    }}
                                    value={Cajasprimeras}
                                    keyboardType='decimal-pad'
                                />
                            </View>
                            <View style={{ width: '50%', alignItems: 'center' }}>
                                <Text style={style.text}>Irregulares</Text>
                                <TextInput
                                    style={[style.textInput, { width: '90%' }]}
                                    onChangeText={(value) => {
                                        setCajasIrregular(value)
                                    }}
                                    value={CajasIrregular}
                                    keyboardType='decimal-pad'
                                />
                            </View>
                        </View>

                        <View style={{ width: '100%', justifyContent: 'space-between', flexDirection: 'row' }}>
                            <Pressable disabled={Cajasprimeras.length == 0 && CajasIrregular.length == 0} onPress={imprimir} style={[style.pressable, { backgroundColor: '#40A2E3' }]}>
                                <Text style={[style.text, { color: grey, marginTop: 0 }]}>Imprimir</Text>
                            </Pressable>
                            <Pressable onPress={() => {

                                setShowModalPrint(false)
                            }} style={[style.pressable, { backgroundColor: '#FF6600' }]}>
                                <Text style={[style.text, { color: grey, marginTop: 0 }]}>Cancelar</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const style = StyleSheet.create({
    textInput: {
        maxWidth: 450,
        width: '79%',
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

    },
    modal: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        backgroundColor: '#00000099',

    },
    constainer: {
        width: '80%',
        backgroundColor: grey,
        alignItems: 'center',
        borderRadius: 10,
        paddingVertical: 15,
        paddingHorizontal: 20,
        maxHeight: 400
    },
    text: {
        fontWeight: 'bold',
        marginTop: 10,
        color: navy
    },
    pressable: {
        backgroundColor: '#0078AA',
        paddingVertical: 7,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 15
    }
})
