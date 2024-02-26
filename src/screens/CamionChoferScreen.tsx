import React, { FC, useContext, useState } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Header from '../components/Header'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../navigation/navigation'
import { TextInput } from 'react-native-gesture-handler'
import { black, grey, orange } from '../constants/Colors'
import MyAlert from '../components/MyAlert'
import { WMSContext } from '../context/WMSContext'
type props = StackScreenProps<RootStackParams, "CamionChoferScreen">


export const CamionChoferScreen: FC<props> = ({ navigation }) => {
    const [camion, setCamion] = useState<string>('')
    const [Chofer, setChofer] = useState<string>('')
    const [showMensajeAlerta, setShowMensajeAlerta] = useState<boolean>(false);
    const [tipoMensaje, setTipoMensaje] = useState<boolean>(false);
    const [mensajeAlerta, setMensajeAlerta] = useState<string>('');
    const {changeCamion,changeChofer} = useContext(WMSContext)

    const onPress = () => {
        if (camion != '' && Chofer != '') {
            changeCamion(camion)
            changeChofer(Chofer)
            navigation.navigate('TelaPackingScreen')
        } else {
            setMensajeAlerta('Campo ' + (camion == '' ? 'Camion' : 'Chofer') + ' es obligatorio')
            setTipoMensaje(false)
            setShowMensajeAlerta(true)
        }
    }

    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='' texto2='' texto3=''/>
            <Image
                source={require('../assets/Packing.png')}
                style={{ width: 100, height: 100, resizeMode: 'contain' }}
            />
            <View style={style.textInput}>

                <TextInput
                    placeholder='Camion'
                    placeholderTextColor={'#fff'}
                    onChangeText={(value) => setCamion(value)}
                    value={camion}
                    style={style.input}
                />
            </View>
            <Image
                source={require('../assets/Chofer.png')}
                style={{ width: 110, height: 110, resizeMode: 'contain' }}
            />
            <View style={style.textInput}>
                <TextInput
                    placeholder='Chofer'
                    placeholderTextColor={'#fff'}
                    onChangeText={(value) => setChofer(value)}
                    value={Chofer}
                    style={style.input}
                />
            </View>
            <TouchableOpacity style={{ backgroundColor: orange, width: '90%', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }} onPress={onPress}>
                <Text style={{ color: grey }}>Siguiente</Text>
            </TouchableOpacity>
            <MyAlert visible={showMensajeAlerta} tipoMensaje={tipoMensaje} mensajeAlerta={mensajeAlerta} onPress={() => setShowMensajeAlerta(false)} />
        </View>
    )
}

const style = StyleSheet.create({
    input: {
        flex: 3,
        padding: 5,
        marginLeft: 10,
        color: black
    },
    textInput: {
        width: '90%',
        backgroundColor: grey,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        borderWidth: 1,
        marginTop: 5,

    }
})
