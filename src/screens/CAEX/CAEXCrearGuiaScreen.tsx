import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { RootStackParams } from '../../navigation/navigation'
import { StackScreenProps } from '@react-navigation/stack'
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Header from '../../components/Header'
import { DetallePickingRouteID, GenerarGuiaCaex } from '../../interfaces/CAEX/CaexInterface'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { black, green, grey, orange } from '../../constants/Colors'
import { WmSApiCaex } from '../../api/WmsApiCaex'
import { WMSContext } from '../../context/WMSContext'
import SoundPlayer from 'react-native-sound-player'


type props = StackScreenProps<RootStackParams, "CAEXCrearGuiaScreen">

export const CAEXCrearGuiaScreen: FC<props> = ({ navigation }) => {
    const [Empaques, setEmpaques] = useState<DetallePickingRouteID[]>([])
    const [BoxCode, setBoxCode] = useState<string>('')
    const textInputRef = useRef<TextInput>(null);
    const textInputRef2 = useRef<TextInput>(null);
    const [cargando, setCargando] = useState<boolean>(false)
    const [manual, setManual] = useState<boolean>(false)
    const [cliente, setCliente] = useState<string>('')
    const { WMSState } = useContext(WMSContext);
    const [cajas, setCajas] = useState<string>('')
    const [reducir, setReducir] = useState<string>('')
    const [enviando, setEnviando] = useState<boolean>(false)


    const onScan = async () => {
        try {
            await WmSApiCaex.get<DetallePickingRouteID>(`ListaEmpaque/${BoxCode}`).then(resp => {
                if (cliente.length > 0) {
                    if (resp.data.cuentaCliente == cliente && !Empaques.find(x => x.pickingRouteID == resp.data.pickingRouteID)) {
                        setEmpaques(Empaques.concat(resp.data))
                        let cantidad: number = parseInt(cajas) + resp.data.cajas
                        setCajas(cantidad + '')
                        PlaySound('success')
                    } else {
                        PlaySound('error')
                    }
                } else {
                    setEmpaques(Empaques.concat(resp.data))
                    setCliente(resp.data.cuentaCliente)
                    setCajas(resp.data.cajas + '')
                    PlaySound('success')
                }
                setBoxCode('')
            })


        } catch (err) {

        }
    }

    const renderItem = (item: DetallePickingRouteID) => {
        return (
            <View style={style.containerCard} >
                <View style={style.card} >
                    <Text style={style.textCardBold}>Pedido: <Text style={style.textCard}>{item.salesID}</Text></Text>
                    <Text style={style.textCardBold}>Empaque: <Text style={style.textCard}>{item.pickingRouteID}</Text></Text>
                    <Text style={style.textCardBold}>Cajas: <Text style={style.textCard}>{item.cajas}</Text></Text>
                    <Text style={style.textCardBold}>Cliente: </Text>
                    <Text style={style.textCard}>{item.cuentaCliente} {item.cliente}</Text>
                    <Text style={style.textCardBold}>Empacador<Text style={style.textCard}>{item.empacador}</Text></Text>
                    <Text style={style.textCardBold}>Embarque:<Text style={style.textCard}>{item.embarque}</Text></Text>
                </View>
            </View>

        )
    }

    const generarGuia = async () => {
        if (!enviando) {
            setEnviando(true)
            let listas: string = ''
            let cont: number = 0
            let fin: number = Empaques.length
            Empaques.forEach(element => {
                listas = listas + element.pickingRouteID
                cont++
                if (cont != fin) {
                    listas = listas + ','
                }

            })
            console.log(`GenerarGuia/${cliente}/${listas}/${cajas}/${WMSState.usuario}`)
            try {
                await WmSApiCaex.get<GenerarGuiaCaex>(`GenerarGuia/${cliente}/${listas}/${cajas}/${WMSState.usuario}`)
                    .then(resp => {
                        if (resp.data.resultadoOperacionMultiple.resultadoExitoso) {
                            PlaySound('success')
                            setEmpaques([])
                            setCliente('')
                            setCajas('')
                        } else {
                            Alert.alert(resp.data.resultadoOperacionMultiple.mensajeError)

                        }

                    })
            } catch (err) {
                Alert.alert(err + '')
            }
            setEnviando(false)
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
        if (!manual && BoxCode.length > 0) {
            onScan()
        }
    }, [BoxCode])
    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='CAEX' texto2='' texto3='' />
            <View style={[style.textInput, { borderColor: !manual ? '#77D970' : '#CD4439' }]}>

                <Switch value={manual} onValueChange={() => setManual(!manual)}
                    trackColor={{ false: '#C7C8CC', true: '#C7C8CC' }}
                    thumbColor={!manual ? '#77D970' : '#CD4439'} />

                <TextInput
                    ref={textInputRef}
                    onChangeText={(value) => { setBoxCode(value) }}
                    value={BoxCode}
                    style={style.input}
                    //onSubmitEditing={handleEnterPress}
                    placeholder={!manual ? 'Escanear Ingreso...' : 'Ingreso Manual...'}
                    autoFocus
                    onBlur={() => textInputRef2.current?.isFocused() ? null : textInputRef.current?.focus()}
                />
                {!cargando ?
                    <TouchableOpacity onPress={() => {
                        if (manual) {
                            if (BoxCode.length > 0)
                                onScan()
                        } else {
                            setBoxCode('')
                        }
                    }}>
                        <Icon name={manual ? 'search' : 'times'} size={15} color={black} />
                    </TouchableOpacity>
                    :
                    <ActivityIndicator size={20} />
                }

            </View>
            {
                Empaques.length > 1 &&
                <View style={{ flexDirection: 'row', width: '85%', marginBottom: 5 }}>
                    <TextInput
                        ref={textInputRef2}
                        onChangeText={(value) => { setReducir(value) }}
                        value={reducir}
                        style={{ borderWidth: 1, borderRadius: 10, flex: 1, textAlign: 'center', margin: 2 }}
                        placeholder='Reducir'
                        keyboardType='decimal-pad'
                    />
                    <TouchableOpacity style={{ backgroundColor: green, flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => {
                            let redu: number = parseInt(cajas) - parseInt(reducir.length > 0 ? reducir : '0')
                            setCajas(redu + '')
                            setReducir('')
                        }}>
                        <Text style={{ color: black }}>REDUCIR</Text>
                    </TouchableOpacity>

                    <TextInput
                        value={cajas}
                        style={{ borderWidth: 1, borderRadius: 10, flex: 1, textAlign: 'center', margin: 2 }}
                        editable={false}
                    />
                </View>

            }
            {
                Empaques.length > 0 &&
                <TouchableOpacity style={{ backgroundColor: orange, width: '90%', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}
                    onPress={() => generarGuia()}>
                    {
                        enviando ?
                            <ActivityIndicator size={20} />
                            :
                            <Text style={{ color: grey }}>Generar Guia</Text>

                    }
                </TouchableOpacity>
            }

            <View style={{ width: '100%', marginBottom: 10, flex: 1 }}>
                <FlatList
                    data={Empaques}
                    keyExtractor={(item, index) => item.pickingRouteID}
                    renderItem={({ item, index }) => renderItem(item)}
                    refreshControl={
                        <RefreshControl refreshing={false} colors={['#069A8E']} />
                    }
                    showsVerticalScrollIndicator={false}
                />
            </View>



        </View>
    )
}

const style = StyleSheet.create({
    textInput: {
        maxWidth: 450,
        width: '87%',
        backgroundColor: grey,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 5,
        borderWidth: 2
    },
    input: {
        width: '75%',
        textAlign: 'center'
    },
    containerCard: {
        width: '100%',
        borderRadius: 10,
        padding: 5,
        alignItems: 'center',
    },
    card: {
        maxWidth: 450,
        width: '90%',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        borderStyle: 'dashed',
        marginHorizontal: '1%',
        marginVertical: 2,
        borderWidth: 1
    },
    textCard: {
        color: black,
        fontWeight: 'normal'
    },
    textCardBold: {
        color: black,
        fontWeight: 'bold'
    }
})
