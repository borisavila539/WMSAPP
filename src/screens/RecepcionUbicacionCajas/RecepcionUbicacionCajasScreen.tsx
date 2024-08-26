import React, { FC, useEffect, useRef, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import Header from '../../components/Header'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../navigation/navigation'
import { black, grey, orange } from '../../constants/Colors'
import { WmSApi } from '../../api/WMSApi'
import SoundPlayer from 'react-native-sound-player'
import { RecepcioUbicacionCajasInterface } from '../../interfaces/RecepcionUbicacionCajas/RecepcionUbicacionCajasInterface'

type props = StackScreenProps<RootStackParams, "RecepcionUbicacionCajasScreen">


export const RecepcionUbicacionCajasScreen: FC<props> = ({ navigation }) => {
    const [opBoxNum, setOpBoxNum] = useState<string>('')
    const [ubicacion, setUbicacion] = useState<string>('')
    const [cargando, setCargando] = useState<boolean>(false)
    const textInputRef2 = useRef<TextInput>(null);

    const textInputRef = useRef<TextInput>(null);


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
            await WmSApi.get<RecepcioUbicacionCajasInterface>(`RecepcionUbicacionCajas/${opBoxNum}/${ubicacion}`).then(resp => {
                console.log(resp.data)
                if (resp.data.ok == 'OK') {
                    PlaySound('success')
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

    useEffect(()=>{
        if(ubicacion!='' && opBoxNum!=''){
            agregarCaja()
        }
    },[opBoxNum])

    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='Recepcion ubicacion Cajas' texto2='' texto3='' />
            <TextInput
                ref={textInputRef}
                placeholder='OP-XXXXXXXX'
                style={[styles.input,{borderColor:opBoxNum!=''? black:orange,borderWidth:2}]}
                onChangeText={(value) => setOpBoxNum(value)}
                value={opBoxNum}
                onBlur={() => textInputRef2.current?.isFocused() ? null : textInputRef.current?.focus()} />
            <TextInput
                ref={textInputRef2}
                placeholder='Ubicacion'
                style={[styles.input,{borderColor:ubicacion!=''? black:orange,borderWidth:2}]}
                onChangeText={(value) => setUbicacion(value)}
                value={ubicacion} />
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

