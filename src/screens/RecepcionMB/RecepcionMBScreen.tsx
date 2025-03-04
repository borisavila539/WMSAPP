import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { RootStackParams } from '../../navigation/navigation'
import Header from '../../components/Header'
import { RecepcionMBInterface } from '../../interfaces/RecepcionMB/RecepcionMB'
import { WMSApiMB } from '../../api/WMSApiMB'
import { black, green, grey, orange } from '../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import SoundPlayer from 'react-native-sound-player'

type props = StackScreenProps<RootStackParams, "RecepcionMBScreen">


export const RecepcionMBScreen: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<RecepcionMBInterface[]>([])
    const [ubicacion, setUbicacion] = useState<string>('')
    const [boxNum, setBoxNum] = useState<string>('')
    const [cargando, setCargando] = useState<boolean>(false)
    const [agregando, setAgregando] = useState<boolean>(false)
    const [idConsolidado, setidConsolidado] = useState<number>(0)
    const [consolidando, setConsolidando] = useState<boolean>(false)


    const textInputRef = useRef<TextInput>(null);
    const textInputRef2 = useRef<TextInput>(null);

    const getData = async () => {
        if (!cargando) {
            setCargando(true)
            try {
                WMSApiMB.get<RecepcionMBInterface[]>(`ObtenerCajasRack/${ubicacion}`).then(resp => {
                    setData(resp.data)
                })
            } catch (err) {

            }
            setCargando(false)

        }
    }

    const Giones = (cant: number): string => {
        let texto: string = ''
        while (cant > 0) {
            texto += '_'
            cant--
        }
        return texto
    }

    const renderItem = (item: RecepcionMBInterface) => {
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ width: '90%', borderWidth: 1, borderRadius: 10, padding: 5, marginBottom: 2 }}>
                    <Text>{item.orden} {item.nombreColor}{'(' + item.color + ')'}</Text>
                    <View style={{ width: '100%', flexDirection: 'row' }}>

                        <Text style={{ width: 50 }}>Caja: </Text>
                        {
                            data.filter(x => x.idConsolidado == item.id || x.id == item.id)
                                .map(element =>
                                    <Text>
                                        {Giones(5 - item.numeroCaja.toString().length)}{element.numeroCaja}
                                    </Text>
                                )
                        }
                    </View>
                    <View style={{ width: '100%', flexDirection: 'row' }}>

                        <View style={{ width: 50, flexDirection: 'column' }}>
                            <Text>Talla:</Text>
                            <Text>QTY:</Text>
                        </View>
                        {
                            data.filter(x => x.idConsolidado == item.id || x.id == item.id)
                                .map(element =>
                                    <View style={{ flexDirection: 'column' }}>
                                        <Text>{Giones(5 - item.talla.toString().length)}{element.talla} </Text>
                                        <Text>{Giones(5 - item.cantidad.toString().length)}{element.cantidad}</Text>
                                    </View>
                                )
                        }
                    </View>
                </View>
            </View>
        )
    }

    const insertBox = async () => {
        if (!agregando) {
            setAgregando(true)
            try {
                let texto: string[] = boxNum.split(',')
                WMSApiMB.get<RecepcionMBInterface>(`InsertUpdateBox/${texto[0]}/${texto[1]}/${ubicacion}/${idConsolidado}`).then(resp => {
                    if (resp.data.id > 0) {
                        setBoxNum('')
                        PlaySound('success')
                        if (consolidando && idConsolidado == 0) {
                            setidConsolidado(resp.data.id)
                        }

                    } else {
                        PlaySound('error')
                    }
                })
            } catch (err) {
                Alert.alert('error')
            }
            setAgregando(false)

        }
    }

    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }


    useEffect(() => {
        if (ubicacion.length > 0) {
            getData()
        } else {
            setData([])
        }
    }, [ubicacion])

    useEffect(() => {
        if (boxNum.length > 0) {
            insertBox()
        } else {
            getData()
        }
    }, [boxNum])

    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='Recepcion Cajas MB' texto2={'Cajas ' + data.filter(x => x.idConsolidado == 0).length + ''} texto3='' />
            <View style={[styles.input, { borderColor: ubicacion != '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center' }]}>
                <TextInput
                    ref={textInputRef}
                    placeholder=''
                    style={[styles.input, { width: '90%', borderWidth: 0 }]}
                    onChangeText={(value) => setBoxNum(value)}
                    value={boxNum}
                    onBlur={() => textInputRef2.current?.isFocused() ? null : textInputRef.current?.focus()} />

                <TouchableOpacity disabled={agregando} onPress={() => setBoxNum('')}>
                    {
                        agregando ?
                            <ActivityIndicator size={10} />
                            :
                            <Icon name='times' size={15} color={black} />
                    }
                </TouchableOpacity>
            </View>
            <View style={[styles.input, { borderColor: ubicacion != '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center' }]}>
                <TextInput
                    ref={textInputRef2}
                    placeholder='Ubicacion'
                    style={[styles.input, { width: '90%', borderWidth: 0 }]}
                    onChangeText={(value) => setUbicacion(value)}
                    value={ubicacion} />
                <TouchableOpacity disabled={cargando} onPress={() => setUbicacion('')}>
                    {
                        cargando ?
                            <ActivityIndicator size={10} />
                            :
                            <Icon name='times' size={15} color={black} />
                    }

                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => { setConsolidando(!consolidando); setidConsolidado(0) }} style={{ backgroundColor: consolidando ? green : orange, width: '90%', padding: 6, alignItems: 'center', borderRadius: 10, marginTop: 5 }}>
                {
                    consolidando ?
                        <Text>CONSOLIDANDO...</Text>
                        :
                        <Text style={{ color: grey, fontWeight: 'bold' }}>CONSOLIDAR</Text>
                }
            </TouchableOpacity>

            <View style={{ width: '100%', marginTop: 5, flex: 1 }}>
                <FlatList
                    data={data.filter(x => x.idConsolidado == 0)}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item, index }) => renderItem(item)}
                    refreshControl={<RefreshControl refreshing={false} onRefresh={getData} />}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: grey,
        borderWidth: 1,
        borderRadius: 10,
        width: '90%',
        textAlign: 'center',
        marginTop: 3
    }
})

