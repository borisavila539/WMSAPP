import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { RootStackParams } from '../../../../navigation/navigation'
import { WMSContext } from '../../../../context/WMSContext'
import { DevolucionDetalleinterface, DevolucionesInterface } from '../../../../interfaces/Devoluciones/Devoluciones';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { WmSApi } from '../../../../api/WMSApi'
import SoundPlayer from 'react-native-sound-player'
import { green, grey, orange } from '../../../../constants/Colors'
import Header from '../../../../components/Header';

type props = StackScreenProps<RootStackParams, "DevolucionRecibirCDDetalle">
export const DevolucionRecibirCDDetalle: FC<props> = ({ navigation }) => {

    const { WMSState } = useContext(WMSContext)
    const [cargando, setCargando] = useState<boolean>(false)
    const [data, setData] = useState<DevolucionDetalleinterface[]>([])
    const [sumar, setSumar] = useState<string>('')
    const [selected, setSelected] = useState<DevolucionDetalleinterface>()
    const [itemBarcode, setItembarcode] = useState<string>('')
    const textInputRefBarra = useRef<TextInput>(null);
    const textInputRefSuma = useRef<TextInput>(null);
    const [mantener, setmantener] = useState<boolean>(false)
    const [enviandoEstado, setEnviandoEstado] = useState<boolean>(false)


    const agregarBarra = async () => {
        try {
            let select: DevolucionDetalleinterface | undefined = data.find(x => x.itembarcode == itemBarcode);
            if (select != undefined) {
                await WmSApi.get<DevolucionDetalleinterface>(`DevolucionDetalleQTY/${select.id}/1/CD`).then(resp => {
                    if (resp.data.recibidaCD != select.recibidaCD) {
                        PlaySound('success')
                        getData()
                        setItembarcode('')
                    }
                })
            } else {
                setItembarcode('')
                PlaySound('error')
            }

        } catch (err) {
            Alert.alert('error')
        }
        textInputRefBarra.current?.focus()
    }

    const agregarManual = async (select: DevolucionDetalleinterface) => {
        try {
            if (sumar != '' && sumar != '0') {
                await WmSApi.get<DevolucionDetalleinterface>(`DevolucionDetalleQTY/${select.id}/${sumar}/CD`).then(resp => {
                    if (resp.data.recibidaCD != select.recibidaCD) {
                        PlaySound('success')
                        getData()
                        setSumar('')
                    }
                })
            } else {
                PlaySound('error')
            }


        } catch (err) {
            Alert.alert('error')
        }
    }

    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }

    const getData = async () => {
        if (!cargando) {
            setCargando(true)
            try {
                await WmSApi.get<DevolucionDetalleinterface[]>(`DevolucionDetalle/${WMSState.devolucion.id}`)
                    .then(resp => {
                        setData(resp.data)
                        let select: DevolucionDetalleinterface | undefined = resp.data.find(x => x.itembarcode == (itemBarcode.length > 0 ? itemBarcode : selected?.itembarcode));
                        if (select != undefined) {
                            setSelected(select)
                        }
                    })
            } catch (err) {
                Alert.alert('err')
            }
            setCargando(false)
        }
    }

    const onPress = (item: DevolucionDetalleinterface) => {
        setSelected(item)
    }

    const renderItem = (item: DevolucionDetalleinterface, index: number, isSelected: boolean) => {
        const getColor = (): string => {
            if ((item.recibidaCD / item.cantidad) == 0) {
                return '#FFE61B'
            } else if ((item.recibidaCD / item.cantidad) == 1) {

                return '#40A2E3'
            } else {
                return '#FFB72B'
            }
        }
        return (
            <View style={{ width: '100%', alignItems: 'center', marginBottom: 3 }}>
                <TouchableOpacity
                    //disabled={isSelected}
                    onPress={() => { isSelected ? null : onPress(item); }}
                    style={{ backgroundColor: getColor(), width: '90%', borderRadius: 15, paddingVertical: 5, paddingHorizontal: 10, marginTop: 5, borderWidth: isSelected ? 2 : 0 }}
                >
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={style.textRender}>Articulo: {item.articulo}</Text>
                        <Text style={style.textRender}>{item.recibidaCD}/{item.cantidad}</Text>
                    </View>
                    <Text style={style.textRender}>Cod. Barra: {item.itembarcode}</Text>
                    <Text style={style.textRender}>Talla: {item.talla}</Text>
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={style.textRender}>Color: {item.color}</Text>
                        {
                            isSelected &&
                            <View style={{ width: '30%', borderRadius: 10, padding: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                                <TextInput
                                    ref={textInputRefSuma}
                                    style={{ width: '60%', borderRadius: 10, padding: 1, backgroundColor: grey }}
                                    onChangeText={(value) => setSumar(value)}
                                    value={sumar}
                                    keyboardType='decimal-pad'
                                />
                                <TouchableOpacity onPress={() => agregarManual(item)} style={{ backgroundColor: green, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10, width: '35%' }}>
                                    <Text style={style.textRender}>+</Text>
                                </TouchableOpacity>

                            </View>
                        }

                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    const ActualizarEstado = async (tipo: string) => {
        if (!enviandoEstado) {
            setEnviandoEstado(true)
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
            setEnviandoEstado(false)

        }

    }

    useEffect(() => {
        getData()
    }, [])

    useEffect(() => {
        if (itemBarcode.length > 0) {
            agregarBarra()

        }
        setmantener(true)
    }, [itemBarcode])

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, }}>
            <Header
                texto1='Recibir CD'
                texto2={WMSState.devolucion.numDevolucion ? WMSState.devolucion.numDevolucion : WMSState.devolucion.numeroRMA}
                texto3={data.reduce((suma, devolucion) => suma + devolucion.recibidaCD, 0) + '/' + data.reduce((suma, devolucion) => suma + devolucion.cantidad, 0)} />
            <View style={{ width: '100%', alignItems: 'center' }}>
                <TextInput
                    ref={textInputRefBarra}
                    style={style.textInput}
                    onChangeText={(value) => setItembarcode(value)}
                    value={itemBarcode}
                    autoFocus
                //onBlur={() => mantener ? textInputRefBarra.current?.focus() : null}

                />
            </View>
            {
                data.reduce((suma, devolucion) => suma + devolucion.recibidaCD, 0) == data.reduce((suma, devolucion) => suma + devolucion.cantidad, 0)
                    ?
                    <View style={{ width: '100%', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => ActualizarEstado('Recibido CD')} style={{ backgroundColor: green, width: '85%', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10, marginTop: 5, alignItems: 'center' }}>
                            <Text style={style.textRender}>RECIBIR</Text>
                        </TouchableOpacity>
                    </View>
                    :
                    <View style={{ width: '100%', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => ActualizarEstado('Rechazado')} style={{ backgroundColor: orange, width: '85%', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10, marginTop: 5, alignItems: 'center' }}>
                            <Text style={[style.textRender, { color: grey }]}>RECHAZAR</Text>
                        </TouchableOpacity>
                    </View>
            }
            {
                selected &&
                renderItem(selected, 10000, true)
            }
            {
                cargando ?
                    <ActivityIndicator size={20} />
                    :
                    null
            }
            <FlatList
                data={data}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => renderItem(item, index, false)}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                }
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
