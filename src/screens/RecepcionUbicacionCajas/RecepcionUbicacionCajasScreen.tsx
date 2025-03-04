import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Header from '../../components/Header'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../navigation/navigation'
import { black, green, grey, orange } from '../../constants/Colors'
import { WmSApi } from '../../api/WMSApi'
import SoundPlayer from 'react-native-sound-player'
import { RecepcioUbicacionCajasInterface, UbicacionesInterface } from '../../interfaces/RecepcionUbicacionCajas/RecepcionUbicacionCajasInterface';
import { WMSContext, WMSState } from '../../context/WMSContext';
import Icon from 'react-native-vector-icons/FontAwesome5'
import { SelectList } from 'react-native-dropdown-select-list'



type props = StackScreenProps<RootStackParams, "RecepcionUbicacionCajasScreen">


export const RecepcionUbicacionCajasScreen: FC<props> = ({ navigation }) => {
    const [opBoxNum, setOpBoxNum] = useState<string>('')
    const [camion, setCamion] = useState<string>('')
    const [ubicacion, setUbicacion] = useState<string>('')
    const [cargando, setCargando] = useState<boolean>(false)
    const textInputRef3 = useRef<TextInput>(null);
    const textInputRef2 = useRef<TextInput>(null);
    const textInputRef = useRef<TextInput>(null);
    const { WMSState, changeUbicaciones } = useContext(WMSContext)
    const [enviar, setEnviar] = useState<boolean>(false)
    const [validarcamion, setValidarCamion] = useState(true)
    //const [tipo, setTipo] = useState<boolean>(true);
    const [tipo, setTipo] = useState<{ key: string, value: string }[]>(
        [
            { key: 'DENIM', value: 'DENIM' },
            { key: 'TP', value: 'TP' },
            { key: 'MB', value: 'MB' }
        ]
    )
    const [tiposelected, settiposelected] = useState<string>('DENIM')


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
            await WmSApi.get<RecepcioUbicacionCajasInterface>(`RecepcionUbicacionCajas/${opBoxNum}/${ubicacion}/${tiposelected}`).then(resp => {
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
            let data: UbicacionesInterface[] = [...WMSState.ubicaciones, { ubicacion, camion, usuario: WMSState.usuario, ordenes: [opBoxNum] }]
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

    const enviarCorreo = async () => {
        setEnviar(true)
        try {
            await WmSApi.post<string>('RecepcionUbicacionCajasCorreo', WMSState.ubicaciones)
                .then(resp => {
                    PlaySound('success')
                })
        } catch (err) {
            PlaySound('error')
        }
        setEnviar(false)
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
            if (validarcamion && camion != '') {
                agregarCaja()
            }
            if (!validarcamion) {
                agregarCaja()
            }
        }
    }, [opBoxNum])

    useEffect(() => {
        if (tiposelected=='TP') {
            setValidarCamion(false)
        } else {
            setValidarCamion(true)
        }
    }, [tiposelected])

    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='Recepcion ubicacion Cajas' texto2='' texto3='' />
            <View style={[styles.input, { flexDirection: 'row', borderWidth: 0, justifyContent: 'center' }]}>

                {
                    /*<Text style={{ fontWeight: 'bold', fontSize: 20 }}>{tipo ? "DENIM" : "TP"}</Text>
                    <Switch
                        value={tipo}
                        onValueChange={() => setTipo(!tipo)}
                        trackColor={{ false: '#C7C8CC', true: '#C7C8CC' }}
                        thumbColor={tipo ? '#77D970' : '#CD4439'} />
                    */
                }
                <View style={{ width: '80%', padding: 2 }}>
                    <SelectList
                        setSelected={(val: string) => {
                            settiposelected(val)
                        }}
                        data={tipo}
                        save='key'
                        placeholder='Seleccione Tipo'
                        search={false}
                        dropdownShown={false}
                        defaultOption={{ key: tiposelected, value: tiposelected }}
                        boxStyles={{ backgroundColor: grey, borderColor: tiposelected ? black : orange }}
                        dropdownStyles={{ backgroundColor: grey }}
                    />
                </View>
            </View>

            <TextInput
                ref={textInputRef}
                placeholder='OP-XXXXXXXX'
                style={[styles.input, { borderColor: opBoxNum != '' ? black : orange, borderWidth: 2 }]}
                onChangeText={(value) => setOpBoxNum(value)}
                value={opBoxNum}
                onBlur={() => textInputRef2.current?.isFocused() ? null : (textInputRef3.current?.isFocused() ? null : textInputRef.current?.focus())} />
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
                tiposelected != 'TP' &&
                <View style={[styles.input, { borderColor: camion != '' ? black : orange, borderWidth: 2, flexDirection: 'row' }]}>
                    <TextInput
                        ref={textInputRef3}
                        placeholder='Camion'
                        style={[styles.input, { width: '85%', borderWidth: 0 }]}
                        onChangeText={(value) => setCamion(value)}
                        value={camion} />
                    <Switch
                        value={validarcamion}
                        onValueChange={() => setValidarCamion(!validarcamion)}
                        trackColor={{ false: '#C7C8CC', true: '#C7C8CC' }}
                        thumbColor={validarcamion ? '#77D970' : '#CD4439'} />
                </View>
            }


            {
                WMSState.ubicaciones.length > 0 && tiposelected != 'TP' &&
                <TouchableOpacity onPress={enviarCorreo} style={{ backgroundColor: green, width: '90%', padding: 6, alignItems: 'center', borderRadius: 10, marginTop: 5 }}>
                    {
                        enviar ?
                            <ActivityIndicator size={20} color={grey} />
                            :
                            <Text>Enviar Correo</Text>
                    }
                </TouchableOpacity>
            }

            <View style={{ width: '100%', marginTop: 5, flex: 1 }}>
                <FlatList
                    data={WMSState.ubicaciones}
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

