import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { RootStackParams } from '../../../navigation/navigation'
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Header from '../../../components/Header'
import { black, green, grey, navy, orange, yellow } from '../../../constants/Colors'
import { WMSContext } from '../../../context/WMSContext'
import { DespachoPTCajasAuditarInterface } from '../../../interfaces/DespachoPT/Auditar/DespachoPTCajasAuditarInterface'
import { WmSApi } from '../../../api/WMSApi'
import Icon from 'react-native-vector-icons/FontAwesome5'
import SoundPlayer from 'react-native-sound-player'

type props = StackScreenProps<RootStackParams, "DespachoPTAuditoriaCajas">

export const DespachoPTAuditoriaCajas: FC<props> = ({ navigation }) => {
    const { WMSState, changeBox, changeProdID } = useContext(WMSContext)
    const textInputRef = useRef<TextInput>(null);
    const [cajas, setCajas] = useState<DespachoPTCajasAuditarInterface[]>([])
    const [ProdIDBox, setProdIDBox] = useState<string>('')
    const [cargando, setCargando] = useState<boolean>(false);
    const [enviarCorreo, setEnviarCorreo] = useState<boolean>(false);
    const [visible,setVisible] = useState<boolean>(false)

    const getCajasAuditar = async () => {
        try {
            await WmSApi.get<DespachoPTCajasAuditarInterface[]>(`DespachoPTCajasAuditar/${WMSState.DespachoID}`).then(resp => {
                setCajas(resp.data)
            })
        } catch (err) {

        }
    }
    const EnviarCorreo = async () => {
        setEnviarCorreo(true)
        try {
            await WmSApi.get<string>(`EnviarAuditoriaTP/${WMSState.DespachoID}/${WMSState.usuario}`).then(resp => {
                if (resp.data == "OK") {
                    PlaySound('success')
                    navigation.goBack()
                } else {
                    PlaySound('error')
                }
            })
        } catch (err) {
            PlaySound('error')
        }
        setVisible(false)
        setEnviarCorreo(false)
    }

    const renderItem = (item: DespachoPTCajasAuditarInterface) => {
        const getColor = (): string => {
            if (item.auditado == 0) {
                return grey
            } else if (item.auditado <= (item.qty / 2)) {
                return yellow
            } else if (item.auditado > (item.qty / 2) && item.auditado < item.qty) {
                return orange
            } else {
                return green
            }
        }

        return (
            <View style={{ width: '50%', alignItems: 'center' }}>
                <View style={{ width: '95%', backgroundColor: getColor(), borderRadius: 10, marginBottom: 5, padding: 5, borderWidth: 1 }}>
                    <Text style={style.textRender}>{item.prodID}</Text>
                    <Text style={style.textRender}>{item.itemID}</Text>

                    <Text style={style.textRender}>Talla: {item.size}</Text>
                    <Text style={style.textRender}>Color {item.color}</Text>
                    <Text style={style.textRender}>Caja: {item.box}</Text>
                    <Text style={style.textRender}>QTY: {item.qty}</Text>
                    <Text style={style.textRender}>Auditado: {item.auditado}</Text>
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

    const validarCaja = () => {
        let Prod = ProdIDBox.split(',');
        let qty: number | undefined = cajas.find(x => x.prodID == Prod[0] && x.box == parseInt(Prod[1]))?.qty
        if (qty) {
            PlaySound('success')
            setProdIDBox('')
            changeProdID(Prod[0])
            changeBox(parseInt(Prod[1]))
            navigation.navigate('DespachoPTAuditoriaCajasLineas')

        } else {
            PlaySound('error')
            setProdIDBox('')
        }

    }

    useEffect(() => {
        getCajasAuditar()
    }, [])

    useEffect(() => {
        if (ProdIDBox.length > 0) {
            validarCaja()
            textInputRef.current?.blur()
        }
    }, [ProdIDBox])

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='' texto2={'Auditoria Despacho:' + WMSState.DespachoID} texto3='' />
            <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => setVisible(true)}
                    style={{ backgroundColor: green, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginRight: 3, width: '10%' }}
                    disabled={enviarCorreo }
                >
                    {
                        enviarCorreo ?
                            <ActivityIndicator />
                            :
                            <Icon name='check' size={15} color={black} />
                    }

                </TouchableOpacity>
                <View style={[style.textInput, { borderColor: '#77D970' }]}>
                    <TextInput
                        ref={textInputRef}
                        onChangeText={(value) => { setProdIDBox(value) }}
                        value={ProdIDBox}
                        style={style.input}
                        placeholder='Escanear Caja...'
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
            </View>
            <FlatList
                data={cajas}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => renderItem(item)}
                showsVerticalScrollIndicator={false}
                numColumns={2}
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => getCajasAuditar()} colors={['#069A8E']} />
                }
            />
            <Modal visible={visible} transparent={true}>
            <View style={style.modal}>
                <View style={style.constainer}>
                    <Text>
                        <Icon name={'exclamation-triangle'} size={80} color={'#E14D2A'} />
                    </Text>
                    <Text style={style.text}>
                        ¿Esta seguro de Enviar?
                    </Text>
                    <View style={{width:'100%', flexDirection:'row',justifyContent:'space-around'}}>
                    <Pressable onPress={() => {
                                setVisible(false)
                                EnviarCorreo()
                            }} style={style.pressable}>
                        <Text style={[style.text, { color: grey, marginTop: 0 }]}>SI</Text>
                    </Pressable>
                    <Pressable onPress={()=>setVisible(false)} style={style.pressable}>
                        <Text style={[style.text, { color: grey, marginTop: 0 }]}>No</Text>
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
        width: '85%',
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
        color: black
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
        maxHeight: 300
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
