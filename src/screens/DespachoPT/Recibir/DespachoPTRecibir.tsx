import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { RootStackParams } from '../../../navigation/navigation'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Header from '../../../components/Header'
import { black, blue, grey, orange } from '../../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { WmSApi } from '../../../api/WMSApi'
import { WMSContext } from '../../../context/WMSContext'
import { DespachoPTRecibirInterface, ReceiveDespachoPTInterface } from '../../../interfaces/DespachoPT/Recibir/DespachoPTRecibirInterface'
import SoundPlayer from 'react-native-sound-player'

type props = StackScreenProps<RootStackParams, "DespachoPTRecibir">

export const DespachoPTRecibir: FC<props> = ({ navigation }) => {
    const [ProdIDBox, setProdIDBox] = useState<string>('')
    const textInputRef = useRef<TextInput>(null);
    const [cargando, setCargando] = useState<boolean>(false);
    const { WMSState } = useContext(WMSContext);
    const [data, setData] = useState<DespachoPTRecibirInterface[]>([])
    const [Pendiente, setPendiente] = useState<DespachoPTRecibirInterface[]>([])
    const [Escaneado, setEscaneado] = useState<DespachoPTRecibirInterface[]>([])



    const getData = async () => {

        try {
            await WmSApi.get<DespachoPTRecibirInterface[]>(`DespachoPTEnviados/${WMSState.DespachoID}`).then((resp) => { //Colocar almacen
                setData(resp.data)
                let data1: DespachoPTRecibirInterface[] = []
                let data2: DespachoPTRecibirInterface[] = []
                resp.data.forEach(element => {
                    if (element.receive) {
                        data2.push(element)
                    } else {
                        data1.push(element)
                    }
                })

                setPendiente(data1)
                setEscaneado(data2)


                //console.log(resp.data)
            })
        } catch (err) {
            console.log(err)
        }

    }

    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }

    const agregarCajaReccibir = async () => {
        if (!cargando) {
            setCargando(true)

            try {
                let Prod = ProdIDBox.split(',');

                await WmSApi.get<ReceiveDespachoPTInterface>(`ReceiveDespachoPT/${Prod[0]}/${WMSState.usuario}/${Prod[1]}`).then((resp) => {
                    if (resp.data.receive) {
                        if (data.find(x => x.prodID == resp.data.prodid && x.box == resp.data.box)?.needAudit) {
                            PlaySound('repeat')
                        } else {
                            PlaySound('success')

                        }
                        setProdIDBox('')
                        getData()
                    } else {
                        PlaySound('error')
                    }
                })
            } catch (err) {
                PlaySound('error')
            }
            setCargando(false)
        }
    }

    const renderItem = (item: DespachoPTRecibirInterface) => {
        const fecha = (): string => {
            const fechaS = new Date(item.fechaPacking);
            return fechaS.getDate() + '/' + fechaS.getMonth() + '/' + fechaS.getFullYear()
        }

        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ width: '95%', backgroundColor: !item.receive ? orange : (item.needAudit ? black : blue), borderRadius: 10, marginBottom: 5, padding: 5 }}>
                    <Text style={style.textRender}>{item.prodID}</Text>
                    <Text style={style.textRender}>Talla: {item.size}</Text>
                    <Text style={style.textRender}>QTY: {item.qty}</Text>
                    <Text style={style.textRender}>Color {item.color}</Text>
                    <Text style={style.textRender}>Caja: {item.box}</Text>
                    <Text style={style.textRender}>Fecha: {fecha()}</Text>
                </View>
            </View>
        )
    }

    useEffect(() => {
        getData()
    }, [])
    useEffect(() => {
        if (ProdIDBox.length > 0) {
            agregarCajaReccibir()
            textInputRef.current?.blur()
        }
    }, [ProdIDBox])
    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey,alignItems: 'center' }}>
            <Header texto1='' texto2='Despacho PT Recibir' texto3={'Recibido: ' + Escaneado.length + '/' + data.length} />
            <View style={[style.textInput, { borderColor: '#77D970' }]}>
                <TextInput
                    ref={textInputRef}
                    onChangeText={(value) => { setProdIDBox(value) }}
                    value={ProdIDBox}
                    style={style.input}
                    placeholder='Escanear Ingreso...'
                    autoFocus
                    onBlur={() => textInputRef.current?.isFocused() ? null : textInputRef.current?.focus()}

                />
                {!cargando ?
                    <TouchableOpacity onPress={() => setProdIDBox('')}>
                        <Icon name='times' size={15} color={black} />
                    </TouchableOpacity>
                    :
                    <ActivityIndicator size={20} />
                }
            </View>
            <View style={{ flex: 1, width: '100%', flexDirection: 'row' }}>
                <View style={{ flex: 1, width: '50%' }}>
                    <Text style={{ textAlign: 'center' }}>Pendiente</Text>
                    {
                        data.length > 0 &&
                        <FlatList
                            data={Pendiente}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item, index }) => renderItem(item)}
                            showsVerticalScrollIndicator={false}

                            refreshControl={
                                <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                            }
                        />
                    }
                </View>
                <View style={{ flex: 1, width: '50%' }}>
                    <Text style={{ textAlign: 'center' }}>Escaneado</Text>
                    {
                        data.length > 0 &&
                        <FlatList
                            data={Escaneado}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item, index }) => renderItem(item)}
                            showsVerticalScrollIndicator={false}

                            refreshControl={
                                <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                            }
                        />
                    }
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
        color: grey
    }
})
