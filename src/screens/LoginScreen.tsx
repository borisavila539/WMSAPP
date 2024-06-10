import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useState } from 'react'
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { RootStackParams } from '../navigation/navigation'
import { black, blue, grey, navy, orange } from '../constants/Colors'
import Icon from 'react-native-vector-icons/Ionicons'
import { WmSApi } from '../api/WMSApi'
import { LoginInterface } from '../interfaces/LoginInterface'
import MyAlert from '../components/MyAlert'
import { WMSContext } from '../context/WMSContext'

type props = StackScreenProps<RootStackParams, "LoginScreen">

export const LoginScreen: FC<props> = ({ navigation }) => {
    const [user, setuser] = useState<string>('');
    const [pass, setPass] = useState<string>('');
    const [show, setShow] = useState<boolean>(true);
    const [enviando, setEnviando] = useState<boolean>(false);
    const [showMensajeAlerta, setShowMensajeAlerta] = useState<boolean>(false);
    const [tipoMensaje, setTipoMensaje] = useState<boolean>(false);
    const [mensajeAlerta, setMensajeAlerta] = useState<string>('');
    const { changeUsuario,changeUsuarioAlmacen } = useContext(WMSContext)

    const login = async () => {
        setEnviando(true)
        try {
            let datos: LoginInterface = {
                user,
                pass,
                logeado: false,
                almacen:0
            }
            //navigation.navigate('DespachoPTConsultaOPDetalle');
            await WmSApi.post<LoginInterface>('Login', datos).then(x => {                
                if (x.data.logeado) {
                    setuser('')
                    setPass('')
                    changeUsuario(x.data.user)
                    changeUsuarioAlmacen(x.data.almacen)
                    navigation.navigate('MenuScreen');
                } else {
                    setMensajeAlerta('Usuario o contraseña incorrecta...')
                    setTipoMensaje(false);
                    setShowMensajeAlerta(true);
                }
            })
        } catch (err) {
            setMensajeAlerta('Error de conexion'+ err)
            setTipoMensaje(false);
            setShowMensajeAlerta(true);
        }

        setEnviando(false)
    }

    return (
        <View style={style.container}>
            <View style={style.containerImage}>
                <Image
                    source={require('../assets/ImageLogin.png')}
                    style={style.imagen}
                />
            </View>
            <View style={style.containerForm}>
                <View style={style.form}>
                    <View style={style.textInput}>
                        <Text>
                            <Icon name='person' size={20} color={black} />
                        </Text>
                        <TextInput
                            placeholder='usuario'
                            placeholderTextColor={'#fff'}
                            onChangeText={(value) => setuser(value)}
                            value={user}
                            style={style.input}
                        />
                    </View>
                    <View style={style.textInput}>
                        <Text>
                            <Icon name='lock-closed' size={20} color={black} />
                        </Text>
                        <TextInput
                            placeholder='Contraseña'
                            placeholderTextColor={'#fff'}
                            onChangeText={(value) => setPass(value)}
                            value={pass}
                            secureTextEntry={show}
                            style={style.input}
                        />
                        <Pressable onPress={() => setShow(!show)}>
                            <Text>
                                <Icon name={show ? 'eye' : 'eye-off'} size={20} color={black} />
                            </Text>
                        </Pressable>
                    </View>
                    <View style={style.containerButton}>
                        <TouchableOpacity style={{ width: '100%', alignItems: 'center' }} onPress={login}>
                            {

                                !enviando ?
                                    <Text style={style.text}>Iniciar Sesion</Text> :
                                    <ActivityIndicator color={grey} />
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <MyAlert visible={showMensajeAlerta} tipoMensaje={tipoMensaje} mensajeAlerta={mensajeAlerta} onPress={() => setShowMensajeAlerta(false)} />
        </View>
    )
}

const style = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: navy,
    },
    containerImage: {
        flex: 1,
        width: '100%',
        backgroundColor: grey,
        borderBottomRightRadius: 50,
        borderBottomLeftRadius: 50
    },
    containerForm: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    form: {
        width: '80%',
        maxWidth: 300,
        padding: 28,
        borderRadius: 20,
        backgroundColor: blue
    },
    input: {
        flex: 3,
        padding: 5,
        marginLeft: 10,
        color: black
    },
    textInput: {
        width: '100%',
        backgroundColor: grey,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5

    },
    containerButton: {
        width: '100%',
        marginTop: 10,
        alignItems: 'center',
        backgroundColor: orange,
        borderRadius: 10,
        padding: 5,
    },
    text: {
        color: grey
    },
    imagen: {
        width: '100%',
        height: '80%',
        resizeMode: 'contain',
        marginBottom: 20
    }

})
