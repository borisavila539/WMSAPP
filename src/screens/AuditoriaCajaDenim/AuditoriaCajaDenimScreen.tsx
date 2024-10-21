import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { RootStackParams } from '../../navigation/navigation'
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Header from '../../components/Header'
import { black, green, grey, navy, orange, yellow } from '../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { WmSApi } from '../../api/WMSApi'
import { AuditoriaCajaDenimInsertInterface, AuditoriaCajaDenimInterface } from '../../interfaces/AuditoriaCajaDenim/AuditoriaCajaDenimInterface'
import { WMSContext } from '../../context/WMSContext'
import SoundPlayer from 'react-native-sound-player'


type props = StackScreenProps<RootStackParams, "AuditoriaCajaDenimScreen">

export const AuditoriaCajaDenimScreen: FC<props> = ({ navigation }) => {
    const [opBoxNum, setOpBoxNum] = useState<string>('')
    const [ubicacion, setUbicacion] = useState<string>('')
    const [articulo, setArticulo] = useState<string>('')

    const [data, setData] = useState<AuditoriaCajaDenimInterface[]>([]);

    const [cargando, setCargando] = useState<boolean>(false)
    const [enviarCorreo, setEnviarCorreo] = useState<boolean>(false);
    const [visible, setVisible] = useState<boolean>(false)

    const textInputRef3 = useRef<TextInput>(null);
    const textInputRef2 = useRef<TextInput>(null);
    const textInputRef = useRef<TextInput>(null);

    const { WMSState } = useContext(WMSContext)

    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<AuditoriaCajaDenimInterface[]>(`AuditoriaCajasDenim/${opBoxNum != '' ? opBoxNum : '-'}/${ubicacion != '' ? ubicacion : '-'}/${WMSState.usuario}`)
                .then(resp => {
                    setData(resp.data)

                })
        } catch (err) {
            console.log(err)
        }
        setCargando(false)
    }
    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }
    const insertArticulo = async () => {
        try {
            let texto: string[] = articulo.split(',');

            if (texto[0] == data[0].articulo && texto[1] == data[0].talla) {
                await WmSApi.get<AuditoriaCajaDenimInsertInterface>(`AuditoriaInsertCajasDenim/${texto[7]}/${data[0].id}`).then(resp => {
                    console.log(resp.data)
                    if (resp.data.response == "OK") {
                        PlaySound('success')
                    } else {
                        PlaySound('repeat')

                    }
                })
            } else {
                PlaySound('error')
            }

        } catch (err) {

        }
        setArticulo('')



    }

    const EnviarCorreo = async () => {
        setEnviarCorreo(true)
        try {
            await WmSApi.get<string>(`EnviarAuditoriaInsertCajasDenim/${ubicacion != '' ? ubicacion : '-'}/${WMSState.usuario}`).then(resp => {
                if (resp.data == "OK") {
                    PlaySound('success')
                    setOpBoxNum('')
                    setUbicacion('')
                } else {
                    PlaySound('error')
                }
            })
        } catch (err) {

        }
        setVisible(false)
        setEnviarCorreo(false)
    }

    useEffect(() => {
        if (ubicacion == '') {
            textInputRef.current?.focus()
            setData([])
        }
        else if (ubicacion != '' && opBoxNum == '') {
            textInputRef2.current?.focus()
            getData()
        } else if (ubicacion != '' && opBoxNum != '' && articulo == '') {
            getData()
            textInputRef3.current?.focus()
        } else if (ubicacion != '' && opBoxNum != '' && articulo != '') {
            insertArticulo()
        }
    }, [ubicacion, opBoxNum, articulo])

    useEffect(() => {
        textInputRef.current?.focus()
    }, [])

    const renderItem = (item: AuditoriaCajaDenimInterface) => {
        const getColor = (): string => {
            let result: number = item.auditado / item.cantidad;
            switch (result) {
                case 1:
                    return green
                    break;
                case 0:
                    return orange;
                    break;
                default:
                    return yellow;
            }
        }

        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ width: '90%', flexDirection: 'row', borderRadius: 10, padding: 5, marginBottom: 2, backgroundColor: getColor() }}>
                    <View style={{ width: '85%' }}>
                        <Text style={styles.text}> Orden: {item.op} Caja: {item.numeroCaja}</Text>
                        <Text style={styles.text}> Articulo: {item.articulo} </Text>
                        <Text style={styles.text}> Talla: {item.talla} </Text>
                        <Text style={styles.text}> Auditado: {item.auditado}/ {item.cantidad} </Text>


                    </View>

                </View>
            </View>
        )
    }

    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='' texto2='Auditoria Caja Denim' texto3='' />
            <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => setVisible(true)}
                    style={{ backgroundColor: green, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginRight: 3, width: '10%' }}
                    disabled={enviarCorreo || ubicacion.length == 0}
                >
                    {
                        enviarCorreo ?
                            <ActivityIndicator />
                            :
                            <Icon name='check' size={15} color={black} />
                    }

                </TouchableOpacity>

                <View style={[styles.input, { borderColor: ubicacion != '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center', width: '80%' }]}>
                    <TextInput
                        ref={textInputRef}
                        placeholder='Ubicacion'
                        style={[styles.input, { width: '90%', borderWidth: 0 }]}
                        onChangeText={(value) => setUbicacion(value)}
                        value={ubicacion} />
                    <TouchableOpacity onPress={() => setUbicacion('')}>
                        <Icon name='times' size={15} color={black} />
                    </TouchableOpacity>
                </View>

            </View>

            <View style={[styles.input, { borderColor: opBoxNum != '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center' }]}>
                <TextInput
                    ref={textInputRef2}
                    placeholder='Caja'
                    style={[styles.input, { width: '90%', borderWidth: 0 }]}
                    onChangeText={(value) => setOpBoxNum(value)}
                    value={opBoxNum}
                //onBlur={() => textInputRef2.current?.isFocused() ? null : textInputRef.current?.focus()} 
                />
                <TouchableOpacity onPress={() => setOpBoxNum('')}>
                    <Icon name='times' size={15} color={black} />
                </TouchableOpacity>
            </View>

            {
                ubicacion != '' && opBoxNum != '' &&
                <View style={[styles.input, { borderWidth: 2, flexDirection: 'row', alignItems: 'center' }]}>
                    <TextInput
                        ref={textInputRef3}
                        placeholder='Articulo'
                        style={[styles.input, { width: '90%', borderWidth: 0 }]}
                        onChangeText={(value) => setArticulo(value)}
                        value={articulo}
                        onBlur={() => ubicacion != '' && opBoxNum != '' ? textInputRef3.current?.focus() : null}
                    />
                    <TouchableOpacity onPress={() => setArticulo('')}>
                        <Icon name='times' size={15} color={black} />
                    </TouchableOpacity>
                </View>
            }
            {
                cargando &&
                <ActivityIndicator />
            }
            <View style={{ width: '100%', marginTop: 5, flex: 1 }}>
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.op + item.numeroCaja}
                    renderItem={({ item, index }) => renderItem(item)}
                    refreshControl={
                        <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                    }
                />
            </View>
            <Modal visible={visible} transparent={true}>
                <View style={styles.modal}>
                    <View style={styles.constainer}>
                        <Text>
                            <Icon name={'exclamation-triangle'} size={80} color={'#E14D2A'} />
                        </Text>
                        <Text style={styles.text2}>
                            ¿Esta seguro de Enviar?
                        </Text>
                        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around' }}>
                            <Pressable onPress={() => {
                                setVisible(false)
                                EnviarCorreo()
                            }} style={styles.pressable}>
                                <Text style={[styles.text2, { color: grey, marginTop: 0 }]}>SI</Text>
                            </Pressable>
                            <Pressable onPress={() => setVisible(false)} style={styles.pressable}>
                                <Text style={[styles.text2, { color: grey, marginTop: 0 }]}>No</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
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
    },
    text: {
        color: navy,
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
        maxHeight: 300
    },
    text2: {
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


