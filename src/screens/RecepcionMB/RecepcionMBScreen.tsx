import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, RefreshControl, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { RootStackParams } from '../../navigation/navigation'
import Header from '../../components/Header'
import { RecepcionMBInterface } from '../../interfaces/RecepcionMB/RecepcionMB'
import { WMSApiMB } from '../../api/WMSApiMB'
import { black, green, grey, orange } from '../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import SoundPlayer from 'react-native-sound-player'
import { WMSContext } from '../../context/WMSContext';

type props = StackScreenProps<RootStackParams, "RecepcionMBScreen">


export const RecepcionMBScreen: FC<props> = ({ navigation }) => {
    const [Data, setData] = useState<RecepcionMBInterface[]>([])
    const [ubicacion, setUbicacion] = useState<string>('')
    const [camion, setCamion] = useState<string>('')
    const [boxNum, setBoxNum] = useState<string>('')
    const [cargando, setCargando] = useState<boolean>(false)
    const [agregando, setAgregando] = useState<boolean>(false)
    const [enviar, setEnviado] = useState<boolean>(false)
    const [idConsolidado, setidConsolidado] = useState<number>(0)
    const [consolidando, setConsolidando] = useState<boolean>(false)
    //const [recibido, setRecibido] = useState<RecepcionMBInterface[]>([])
    const { WMSState, changeRecepcionMB } = useContext(WMSContext)

    const textInputRef = useRef<TextInput>(null);
    const textInputRef2 = useRef<TextInput>(null);
    const textInputRef3 = useRef<TextInput>(null);


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

    const renderItem = (index: number, item: RecepcionMBInterface) => {
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ width: '90%', borderWidth: 1, borderRadius: 10, padding: 5, marginBottom: 2 }}>
                    <Text>{index + 1}: {item.orden} {item.nombreColor}{'(' + item.color + ')'}</Text>

                    <View style={{ width: '100%', flexDirection: 'row' }}>

                        <Text style={{ width: 50 }}>Caja: </Text>
                        {
                            Data.filter(x => x.idConsolidado == item.id || x.id == item.id)
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
                            Data.filter(x => x.idConsolidado == item.id || x.id == item.id)
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
                WMSApiMB.get<RecepcionMBInterface>(`InsertUpdateBox/${texto[0]}/${texto[1]}/${ubicacion}/${idConsolidado}/${WMSState.usuario}/${camion}`).then(resp => {
                    if (resp.data.id > 0) {
                        if (WMSState.RecepcionMB.find(x => x.id == resp.data.id)) {
                            changeRecepcionMB(WMSState.RecepcionMB.filter(x => x.id != resp.data.id).concat(resp.data))
                        } else {
                            changeRecepcionMB(WMSState.RecepcionMB.concat(resp.data))
                        }

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

    const enviarCorreo = async () => {
        if (!enviar) {
            setEnviado(true)
            try {
                await WMSApiMB.post<string>('EnviarCorreoRecepcion', WMSState.RecepcionMB).then(resp => {
                    if (resp.data == "OK") {
                        PlaySound('success')
                    }
                })

            } catch (err) {
                PlaySound('error')
            }
            setEnviado(false)

        }
    }

    const groupByUbicacion = () => {
        const groupedData: { [key: string]: RecepcionMBInterface[] } = {}
        WMSState.RecepcionMB.forEach(item => {
            if (!groupedData[item.ubicacionRecepcion]) {
                groupedData[item.ubicacionRecepcion] = []
            }
            groupedData[item.ubicacionRecepcion].push(item);
        })
        return Object.keys(groupedData).map(key => ({
            title: key,
            data: groupedData[key]
        }));
    }


    useEffect(() => {
        if (ubicacion.length > 0) {
            getData()
        }
    }, [ubicacion])

    useEffect(() => {
        if (boxNum.length > 0) {
            insertBox()
        } else {
            if (ubicacion.length > 0)
                getData()
        }
    }, [boxNum])

    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='Recepcion Cajas MB' texto2='' texto3='' />
            <View style={{ width: '90%', flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={[styles.input, { borderColor: ubicacion != '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center' }]}>
                    <TextInput
                        ref={textInputRef}
                        placeholder=''
                        style={[styles.input, { width: '90%', borderWidth: 0 }]}
                        onChangeText={(value) => setBoxNum(value)}
                        value={boxNum}
                        editable={camion.length > 0 && ubicacion.length > 0}
                        onBlur={() => textInputRef2.current?.isFocused() ? null : (textInputRef3.current?.isFocused ? null : textInputRef.current?.focus())} />

                    <TouchableOpacity disabled={agregando} onPress={() => setBoxNum('')}>
                        {
                            agregando ?
                                <ActivityIndicator size={10} />
                                :
                                <Icon name='times' size={15} color={black} />
                        }
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={enviarCorreo} style={{ backgroundColor: green, width: '15%', padding: 6, alignItems: 'center', borderRadius: 10, marginTop: 5, justifyContent: 'center' }}>
                    {
                        enviar ?
                            <ActivityIndicator size={20} color={grey} />
                            :
                            <Icon name='check' size={15} color={black} />
                    }
                </TouchableOpacity>

            </View>
            <View style={{ width: '90%', flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={[styles.input, { width: '48%', borderColor: ubicacion != '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center' }]}>
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
                <View style={[styles.input, { width: '48%', borderColor: camion != '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center' }]}>
                    <TextInput
                        ref={textInputRef2}
                        placeholder='Camion'
                        style={[styles.input, { width: '90%', borderWidth: 0 }]}
                        onChangeText={(value) => setCamion(value)}
                        value={camion} />
                    <TouchableOpacity disabled={cargando} onPress={() => setCamion('')}>
                        {
                            cargando ?
                                <ActivityIndicator size={10} />
                                :
                                <Icon name='times' size={15} color={black} />
                        }

                    </TouchableOpacity>
                </View>
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
                <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>{ubicacion + ' (Cajas:' + Data.filter(x => x.idConsolidado == 0).length + ', Etiquetas:' + Data.length + ')'}</Text>
                <FlatList
                    data={Data.filter(x => x.idConsolidado == 0)}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item, index }) => renderItem(index, item)}
                    refreshControl={<RefreshControl refreshing={false} onRefresh={getData} />}
                />
            </View>
            <View style={{ width: '100%', marginTop: 5, flex: 2 }}>
                <View style={{ width: '100%', alignItems: 'center' }}>
                    {
                        /*<TouchableOpacity onPress={() => changeRecepcionMB([])} style={{ backgroundColor: consolidando ? green : orange, width: '90%', padding: 6, alignItems: 'center', borderRadius: 10, marginTop: 5 }}>
                        <Text style={{color:grey,fontWeight:'bold'}}>Limpiar</Text>
                        </TouchableOpacity>*/
                    }
                    <Text style={{ fontWeight: 'bold' }}>Cajas Recibidas {'(Cajas:' + WMSState.RecepcionMB.filter(x => x.idConsolidado == 0).length + ', Etiquetas: ' + WMSState.RecepcionMB.length + ')'}:</Text>

                </View>
                <SectionList
                    sections={groupByUbicacion().reverse()}
                    keyExtractor={(item) => item.id.toString() + item.ubicacionRecepcion.toString()}
                    renderSectionHeader={({ section: { title, data } }) => (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontWeight: 'bold' }}>{title} Cajas:{data.filter(x => x.idConsolidado == 0).length}</Text>
                            <View style={{ width: '15%' }}>
                                <TouchableOpacity onPress={() => changeRecepcionMB(WMSState.RecepcionMB.filter(x => x.ubicacionRecepcion != title))}>
                                    <Text>
                                        <Icon name='trash' size={30} color={black} />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    renderItem={({ item, index }) =>
                        item.idConsolidado == 0
                            ?
                            renderItem(index, item)
                            :
                            <></>

                    }

                //refreshControl={<RefreshControl refreshing={false} onRefresh={getData} />}
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
        width: '85%',
        textAlign: 'center',
        marginTop: 3
    }
})

