import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { RootStackParams } from '../../navigation/navigation'
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Header from '../../components/Header'
import SoundPlayer from 'react-native-sound-player'
import { WmSApi } from '../../api/WMSApi'
import { RecepcioUbicacionCajasInterface, UbicacionesInterface } from '../../interfaces/RecepcionUbicacionCajas/RecepcionUbicacionCajasInterface'
import { WMSContext } from '../../context/WMSContext'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { black, grey, orange } from '../../constants/Colors'


type props = StackScreenProps<RootStackParams, "DeclaracionEnvioScreen">


export const DeclaracionEnvioScreen: FC<props> = ({ navigation }) => {
    const [opBoxNum, setOpBoxNum] = useState<string>('')
    const [ubicacion, setUbicacion] = useState<string>('')
    const textInputRef2 = useRef<TextInput>(null);
    const textInputRef = useRef<TextInput>(null);
    const [cargando, setCargando] = useState<boolean>(false)
    const { WMSState, changeUbicaciones } = useContext(WMSContext)

    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }

    const agregarCaja = async () => {
        setCargando(true)
        try {
            await WmSApi.get<RecepcioUbicacionCajasInterface>(`DeclaracionEnvio/${opBoxNum}/${ubicacion}`).then(resp => {
                console.log(resp.data)
                if (resp.data.ok == 'OK') {
                    PlaySound('success')
                    agregarUbicacion()
                } else {
                    PlaySound('error')
                }
            })
        } catch (err) {
            PlaySound('error')
        }
        setOpBoxNum('')
        setCargando(false)
    }

    const agregarUbicacion = async () => {
        if (!WMSState.ubicaciones.find(x => x.ubicacion == ubicacion)?.ubicacion) {
            let data: UbicacionesInterface[] = [...WMSState.ubicaciones, { ubicacion, camion: '', usuario: WMSState.usuario, ordenes: [opBoxNum] }]
            changeUbicaciones(data)
        } else {
            let data: UbicacionesInterface[] = WMSState.ubicaciones.filter(x => x.ubicacion != ubicacion)
            let line: UbicacionesInterface | undefined = WMSState.ubicaciones.find(x => x.ubicacion == ubicacion)
            if (line != undefined) {
                console.log(line)
                if (!line.ordenes.find(x => x == opBoxNum)) {
                    line.ordenes = [...line.ordenes, opBoxNum]
                }
                changeUbicaciones([...data, line])
            }
        }
    }
    const eliminarUbicacion = (eliminar: string) => {
        if (WMSState.ubicaciones.find(x => x.ubicacion == eliminar)?.ubicacion) {
            let data: UbicacionesInterface[] = WMSState.ubicaciones.filter(x => x.ubicacion != eliminar)
            changeUbicaciones(data)
        }
    }

    const renderItem = (item: UbicacionesInterface) => {
        const cant = (): number => {
            return item.ordenes.length
        }
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ width: '90%', borderWidth: 1, flexDirection: 'row', borderRadius: 10, padding: 5, marginBottom: 2 }}>
                    <View style={{ width: '85%' }}>
                        <Text>Ubicacion: {item.ubicacion}</Text>
                        <Text>Cantidad: {cant()}</Text>
                    </View>
                    <View style={{ width: '15%' }}>
                        <TouchableOpacity onPress={() => eliminarUbicacion(item.ubicacion)}>
                            <Text>
                                <Icon name='trash' size={30} color={black} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    }

    useEffect(() => {
        if (ubicacion != '' && opBoxNum != '') {
            agregarCaja()
        }
    }, [opBoxNum])
    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='Declaracion de Envio' texto2='' texto3='' />
            <TextInput
                ref={textInputRef}
                placeholder='IMXXXXXXXXXX'
                style={[styles.input, { borderColor: opBoxNum != '' ? black : orange, borderWidth: 2 }]}
                onChangeText={(value) => setOpBoxNum(value)}
                value={opBoxNum}
                onBlur={() => textInputRef2.current?.isFocused() ? null : textInputRef.current?.focus()} />
            <View style={[styles.input, { borderColor: ubicacion != '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center' }]}>
                <TextInput
                    ref={textInputRef2}
                    placeholder='Ubicacion'
                    style={[styles.input, { width: '90%', borderWidth: 0 }]}
                    onChangeText={(value) => setUbicacion(value)}
                    value={ubicacion} />
                <TouchableOpacity onPress={() => setUbicacion('')}>
                    <Icon name='times' size={15} color={black} />
                </TouchableOpacity>
            </View>
            {
                cargando &&
                <ActivityIndicator size={20}/>
            }
            <View style={{ width: '100%', marginTop: 5, flex: 1 }}>
                <FlatList
                    data={WMSState.ubicaciones.reverse()}
                    keyExtractor={(item) => item.ubicacion}
                    renderItem={({ item, index }) => renderItem(item)}
                    
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


