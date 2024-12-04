import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { blue, green, grey, orange, yellow } from '../../../constants/Colors'
import Header from '../../../components/Header'
import { RootStackParams } from '../../../navigation/navigation'
import { StackScreenProps } from '@react-navigation/stack'
import { WMSContext } from '../../../context/WMSContext'
import { WmSApi } from '../../../api/WMSApi'
import { DevolucionDetalleinterface, DevolucionesInterface } from '../../../interfaces/Devoluciones/Devoluciones'
import { TextInput } from 'react-native-gesture-handler'
import SoundPlayer from 'react-native-sound-player'

type props = StackScreenProps<RootStackParams, "RecibirPlantaDevolucionesDetalle">
export const RecibirPlantaDevolucionesDetalle: FC<props> = ({ navigation }) => {
    const { WMSState } = useContext(WMSContext)
    const [cargando, setCargando] = useState<boolean>(false)
    const [data, setData] = useState<DevolucionDetalleinterface[]>([])
    const [sumar, setSumar] = useState<string>('')
    const [selected, setSelected] = useState<DevolucionDetalleinterface>()
    const [itemBarcode, setItembarcode] = useState<string>('')
    const textInputRefBarra = useRef<TextInput>(null);
    const textInputRefSuma = useRef<TextInput>(null);
    const [mantener, setmantener] = useState<boolean>(true)
    const [enviandoEstado, setEnviandoEstado] = useState<boolean>(false)


    const agregarBarra = async () => {
        try {
            let select: DevolucionDetalleinterface | undefined = data.find(x => x.itembarcode == itemBarcode);
            if (select != undefined) {
                await WmSApi.get<DevolucionDetalleinterface>(`DevolucionDetalleQTY/${select.id}/1/Planta`).then(resp => {
                    if (resp.data.recibidaPlanta != select.recibidaPlanta) {
                        PlaySound('success')
                        setItembarcode('')
                        getData()
                    }
                })
            } else {
                setItembarcode('')
                PlaySound('error')
            }

        } catch (err) {
            Alert.alert('error')
        }
    }

    const agregarManual = async (select: DevolucionDetalleinterface) => {
        try {
            if (sumar != '' && sumar != '0') {
                await WmSApi.get<DevolucionDetalleinterface>(`DevolucionDetalleQTY/${select.id}/${sumar}/Planta`).then(resp => {
                    if (resp.data.recibidaPlanta != select.recibidaPlanta) {
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
                        let select: DevolucionDetalleinterface | undefined = resp.data.find(x => x.itembarcode == selected?.itembarcode || x.itembarcode == itemBarcode);
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

    const renderItem = (item: DevolucionDetalleinterface, isSelected: boolean) => {
        const getColor = (): string => {
            if ((item.recibidaPlanta / item.cantidad) == 0) {
                return '#FFE61B'
            } else if ((item.recibidaPlanta / item.cantidad) == 1) {

                return '#40A2E3'
            } else {
                return '#FFB72B'
            }
        }
        return (
            <View style={{ width: '100%', alignItems: 'center', marginBottom: 3 }}>
                <TouchableOpacity
                    //disabled={isSelected}
                    onPress={() => { isSelected ? setmantener(false) : onPress(item); setmantener(false) }}
                    style={{ backgroundColor: getColor(), width: '90%', borderRadius: 15, paddingVertical: 5, paddingHorizontal: 10, marginTop: 5, borderWidth: isSelected ? 2 : 0 }}
                >
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={style.textRender}>Articulo: {item.articulo}</Text>
                        <Text style={style.textRender}>{item.recibidaPlanta}/{item.cantidad}</Text>
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
                await WmSApi.get<DevolucionesInterface>(`Devolucion/Estado/${WMSState.devolucion.id}/${tipo}/${WMSState.usuario}`)
                    .then(resp => {
                        if(resp.data.descricpcion == tipo){
                            PlaySound('success')
                            navigation.goBack()
                            navigation.goBack()

                        }else {
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
            textInputRefBarra.current?.focus
        }
        setmantener(true)
    }, [itemBarcode])

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, }}>
            <Header
                texto1='Recibir Planta'
                texto2={WMSState.devolucion.numDevolucion}
                texto3={data.reduce((suma, devolucion) => suma + devolucion.recibidaPlanta, 0) + '/' + data.reduce((suma, devolucion) => suma + devolucion.cantidad, 0)} />
            <View style={{ width: '100%', alignItems: 'center' }}>
                <TextInput
                    ref={textInputRefBarra}
                    style={style.textInput}
                    onChangeText={(value) => setItembarcode(value)}
                    value={itemBarcode}
                    autoFocus
                    onBlur={() => mantener ? textInputRefBarra.current?.focus() : null}

                />
            </View>
            {
                data.reduce((suma, devolucion) => suma + devolucion.recibidaPlanta, 0) == data.reduce((suma, devolucion) => suma + devolucion.cantidad, 0)
                    ?
                    <View style={{ width: '100%', alignItems: 'center' }}>
                        <TouchableOpacity onPress={()=>ActualizarEstado('Recibido en Planta')} style={{ backgroundColor: green, width: '85%', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10, marginTop: 5, alignItems: 'center' }}>
                            <Text style={style.textRender}>RECIBIR</Text>
                        </TouchableOpacity>
                    </View>
                    :
                    <View style={{ width: '100%', alignItems: 'center' }}>
                        <TouchableOpacity onPress={()=>ActualizarEstado('Rechazado')} style={{ backgroundColor: orange, width: '85%', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10, marginTop: 5, alignItems: 'center' }}>
                            <Text style={[style.textRender, { color: grey }]}>RECHAZAR</Text>
                        </TouchableOpacity>
                    </View>
            }
            {
                selected &&
                renderItem(selected, true)
            }
            {
                cargando ?
                    <ActivityIndicator size={20} />
                    :
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item, index }) => renderItem(item, false)}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                        }
                    />
            }

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
