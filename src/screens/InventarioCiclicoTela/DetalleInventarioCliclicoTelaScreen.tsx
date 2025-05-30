import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import { RootStackParams } from '../../navigation/navigation'
import { DetalleInventarioCliclicoTelainterface } from '../../interfaces/InventarioCiclicoTela/DetalleInventarioCliclicoTelainterface'
import { WmSApi } from '../../api/WMSApi'
import { black, blue, green, grey, navy, orange } from '../../constants/Colors'
import Header from '../../components/Header'
import { WMSContext } from '../../context/WMSContext'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Icon from 'react-native-vector-icons/FontAwesome5'
import SoundPlayer from 'react-native-sound-player'
import { EtiquetaRolloInterface } from '../../interfaces/EtiquetaRolloInterface'
import PrintEtiquetaRollo from '../../components/PrintEtiquetaRollo'
import PrintEtiquetaRollo2 from '../../components/PrintEtiquetaRollo2'


type props = StackScreenProps<RootStackParams, "DetalleInventarioCliclicoTelaScreen">


export const DetalleInventarioCliclicoTelaScreen: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<DetalleInventarioCliclicoTelainterface[]>([])
    const [dataNoexist, setDataNoExist] = useState<DetalleInventarioCliclicoTelainterface[]>([])
    const [dataExist, setDataExist] = useState<DetalleInventarioCliclicoTelainterface[]>([])
    const textInputRef = useRef<TextInput>(null);
    const textInputRef2 = useRef<TextInput>(null);
    const [InventSerialID, setinventSerialID] = useState<string>('')
    const [cargando, setCargando] = useState<Boolean>(false)
    const [actualizando, setActualizando] = useState<Boolean>(false)
    const { WMSState } = useContext(WMSContext)
    const [enviar, setEnviar] = useState<boolean>(false)
    const [MensajeEnviado, setMensajeEnviado] = useState<string>('')
    const [qty, setQty] = useState<string>('')
    const [edit, setEdit] = useState<boolean>(false)
    const [rollo, setRollo] = useState<string>('')
    const [DetalleRollo, setDetalleRollo] = useState<EtiquetaRolloInterface>({ inventserialid: '', apvendroll: '', qtytransfer: '', itemid: '', color: '', inventbatchid: '', configid: '', print: '' })
    const [ShowImpresoras, setShowImpresoras] = useState<boolean>(false);

    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<DetalleInventarioCliclicoTelainterface[]>(`InventarioCilicoTelaDiario/${WMSState.diario}`)
                .then(resp => {
                    setData(resp.data)

                    setDataExist(resp.data.filter(x => x.exist))
                    setDataNoExist(resp.data.filter(x => !x.exist))

                })
        } catch (err) {

        }
        setCargando(false)
    }

    const EnviarDiarioAX = async () => {
        setEnviar(true)
        try {
            await WmSApi.get<string>(`EnviarInventarioCilcicoTela/${WMSState.diario}`)
                .then(resp => {
                    setMensajeEnviado(resp.data)
                })
        } catch (err) {
            console.log(err)
        }
        setEnviar(false)

    }

    const renderItem = (item: DetalleInventarioCliclicoTelainterface) => {
        const onPressPrint = () => {
            setDetalleRollo(
                {
                    itemid: item.itemID,
                    apvendroll: item.apvendRoll,
                    color: item.colorName,
                    configid: item.configID,
                    inventbatchid: item.inventBatchID,
                    inventserialid: item.inventSerialID,
                    print: '',
                    qtytransfer: item.inventOnHand.toString()
                }
            )
            setShowImpresoras(true)

        }
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ width: '95%', backgroundColor: !item.exist ? orange : blue, borderRadius: 10, marginBottom: 5, padding: 5 }}>
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TouchableOpacity onPress={() => { setEdit(true); setRollo(item.inventSerialID) }}>
                            <Icon name='edit' size={20} color={grey} />
                        </TouchableOpacity>
                        <Text style={[style.textRender, { textAlign: 'center', fontWeight: 'bold' }]}>{item.inventSerialID}</Text>
                        <TouchableOpacity onPress={onPressPrint}>
                            <Icon name={'print'} size={25} color={grey} />
                        </TouchableOpacity>


                    </View>
                    <Text style={style.textRender}>PR: {item.apvendRoll}</Text>
                    <Text style={style.textRender}>Tela: {item.reference}</Text>
                    <Text style={style.textRender}>Color: {item.colorName}{'(' + item.inventColorID + ')'}</Text>
                    <Text style={style.textRender}>{item.itemID}</Text>
                    <Text style={style.textRender}>{item.inventBatchID}</Text>
                    <Text style={style.textRender}>Ubicacion: {item.wmsLocationID}</Text>
                    <Text style={style.textRender}>QTY:{item.inventOnHand}</Text>
                    <Text style={style.textRender}>Ancho:{item.configID} </Text>
                </View>
            </View>
        )
    }
    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }

    const VerificarRollo = async () => {
        try {
            let item: DetalleInventarioCliclicoTelainterface | undefined = data.find(x => x.inventSerialID == InventSerialID)
            if (item?.exist == true) {
                PlaySound('repeat')
                setinventSerialID('')

            } else {
                await WmSApi.get<DetalleInventarioCliclicoTelainterface>(`InventarioCiclicoTelaExist/${WMSState.diario}/${InventSerialID}/${WMSState.usuario}/${item?.inventOnHand ? item?.inventOnHand : 0}`)
                    .then(resp => {
                        if (resp.data.exist) {
                            setinventSerialID('')
                            PlaySound('success')
                            getData()
                        } else {
                            PlaySound('error')
                            setinventSerialID('')
                        }
                    })
            }
        } catch (err) {
            PlaySound('error')
            setinventSerialID('')
        }

    }
    const ActualizarCantidad = async () => {
        setActualizando(true)
        try {
            await WmSApi.get<DetalleInventarioCliclicoTelainterface>(`ActuallizarQTYCiclicoTela/${rollo}/${qty}`).then(resp => {
                if (resp.data.inventOnHand.toString() == qty) {
                    setQty('')
                    setEdit(false)
                    textInputRef.current?.focus()
                    PlaySound('success')

                    getData()
                } else {
                    PlaySound('error')
                }
            })

        } catch (err) {
            PlaySound('error')
        }
        setActualizando(false)
    }
    useEffect(() => {
        getData();
    }, [])

    useEffect(() => {
        if (InventSerialID.length > 0) {
            VerificarRollo()
            //textInputRef.current?.blur()
        }
    }, [InventSerialID])
    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='Ciclico Tela' texto2={WMSState.diario} texto3={dataExist.length + '/' + data.length + ''} />
            {
                !ShowImpresoras &&
                <>
                    <View style={[style.textInput, { borderColor: '#77D970' }]}>
                        <TextInput
                            ref={textInputRef}
                            onChangeText={(value) => { setinventSerialID(value) }}
                            value={InventSerialID}
                            style={style.input}
                            placeholder='Escanear Ingreso...'
                            autoFocus
                            onBlur={() => textInputRef2.current?.isFocused() ? null : textInputRef.current?.focus()}

                        />
                        {!cargando ?
                            <TouchableOpacity onPress={() => setinventSerialID('')}>
                                <Icon name='times' size={15} color={black} />
                            </TouchableOpacity>
                            :
                            <ActivityIndicator size={20} />
                        }

                    </View>
                    {
                        edit &&
                        <View style={[style.textInput, { borderColor: '#77D970' }]}>
                            <TextInput
                                ref={textInputRef2}
                                onChangeText={(value) => { setQty(value) }}
                                value={qty}
                                style={style.input}
                                keyboardType='decimal-pad'
                                placeholder={'Actualizar QTY ' + rollo}

                            />
                            {!actualizando ?
                                <TouchableOpacity onPress={() => ActualizarCantidad()}>
                                    <Icon name='check' size={15} color={black} />
                                </TouchableOpacity>
                                :
                                <ActivityIndicator size={20} />
                            }

                        </View>
                    }

                    <View style={{ width: '100%', flexDirection: 'row' }}>
                        <View style={{ width: '50%' }}>
                            <TouchableOpacity
                                style={{ backgroundColor: green, width: '98%', alignItems: 'center', borderRadius: 10, paddingVertical: 7 }}
                                onPress={() => navigation.navigate('AgregarInventarioCiclicoTelaScreen')}>
                                <Icon name='plus' size={15} color={black} />
                                <Text style={[style.textRender, { color: black }]}>Agregar</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ width: '50%' }}>
                            <TouchableOpacity style={{ backgroundColor: green, width: '98%', alignItems: 'center', borderRadius: 10, paddingVertical: 7 }} onPress={EnviarDiarioAX}>
                                {
                                    enviar ?
                                        <ActivityIndicator size={20} color={black} />
                                        :
                                        <Icon name='check' size={15} color={black} />

                                }
                                <Text style={[style.textRender, { color: black }]}>Enviar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {
                        MensajeEnviado != '' &&
                        <TouchableOpacity onPress={() => setMensajeEnviado('')} style={{ width: '90%', borderRadius: 10, borderWidth: 1, marginTop: 2, padding: 3, borderColor: blue }}>
                            <Text style={{ color: orange }}>
                                {MensajeEnviado}
                            </Text>
                        </TouchableOpacity>
                    }
                    <View style={{ flexDirection: 'row', flex: 1, width: '100%' }}>

                        <View style={{ flex: 1, width: '100%' }}>
                            <Text style={{ textAlign: 'center', fontWeight: 'bold', color: navy }}>PENDIENTE</Text>
                            {
                                dataNoexist.length > 0 &&
                                <FlatList
                                    data={dataNoexist}
                                    keyExtractor={(item) => item.inventSerialID}
                                    renderItem={({ item, index }) => renderItem(item)}
                                    showsVerticalScrollIndicator={false}
                                    refreshControl={
                                        <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                                    }
                                />
                            }
                        </View>
                        <View style={{ flex: 1, width: '100%' }}>

                            <Text style={{ textAlign: 'center', fontWeight: 'bold', color: navy }}>REVISADO</Text>
                            {
                                dataExist.length > 0 &&
                                <FlatList
                                    data={dataExist}
                                    keyExtractor={(item) => item.inventSerialID}
                                    renderItem={({ item, index }) => renderItem(item)}
                                    showsVerticalScrollIndicator={false}
                                    refreshControl={
                                        <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                                    }
                                />
                            }
                        </View>

                    </View>
                </>
            }
            {
                ShowImpresoras &&
                <PrintEtiquetaRollo2 showImpresoras={ShowImpresoras} onPress={() => setShowImpresoras(false)} data={DetalleRollo} />
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
        color: grey
    }
})