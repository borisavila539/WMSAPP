import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useEffect, useRef, useState } from 'react'
import { RootStackParams } from '../../navigation/navigation'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native'
import Header from '../../components/Header'
import { black, grey, navy } from '../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { ReimpresionCaex } from '../../interfaces/CAEX/CaexInterface'
import SoundPlayer from 'react-native-sound-player'

import { WmSApiCaex } from '../../api/WmsApiCaex'

type props = StackScreenProps<RootStackParams, "ReimpresionEtiquetasCaex">

export const ReimpresionEtiquetasCaex: FC<props> = ({ navigation }) => {
    const textInputRef = useRef<TextInput>(null);
    const [BoxCode, setBoxCode] = useState<string>('')
    const [cargando, setCargando] = useState<boolean>(false)
    const [data, setData] = useState<ReimpresionCaex[]>([])
    const [inicio, setInicio] = useState<string>('')
    const [final, setFinal] = useState<string>('')
    const [imprimiendo, setImprimiendo] = useState<boolean>(false)

    const getData = async () => {
        if (!cargando) {
            setCargando(true)

            try {
                await WmSApiCaex.get<ReimpresionCaex[]>(`ObtenerimpresionEtiquetas/${BoxCode}`).then(resp => {
                    if(resp.data.length>0){
                       setData(resp.data)
                    PlaySound('success')
                    setInicio(Math.min(...resp.data.map(obj => obj.numeroPieza)) + '')
                    setFinal(Math.max(...resp.data.map(obj => obj.numeroPieza)) + '') 
                    }else{
                        PlaySound('error')
                    }
                    
                })
            } catch (err) {
                PlaySound('error')

            }
            setBoxCode('')
            setCargando(false)
        }
    }

    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }

    const renderItem = (item: ReimpresionCaex) => {
        return (
            <View style={style.containerCard}>
                <View style={style.card}>
                    <View style={{ width: '100%', flexDirection: 'row' }}>
                        <Text style={style.textCardBold}>Caja: <Text style={style.textCard}>{item.numeroPieza}</Text></Text>
                        <Text style={style.textCardBold}> Guia: <Text style={style.textCard}>{item.numeroGuia}</Text></Text>

                    </View>
                </View>

            </View>
        )
    }

    const imprimirEtiquetas = async () => {
        if (!imprimiendo) {
            setImprimiendo(true)


            try {
                await WmSApiCaex.post<string>('ImprimirEtiquetas', data.filter(x => x.numeroPieza >= parseInt(inicio) && x.numeroPieza <= parseInt(final))).then(resp => {
                    if (resp.data == 'OK') {
                        PlaySound('success')
                        setData([])
                    } else {
                        PlaySound('error')
                    }
                })
            } catch (err) {
                PlaySound('error')
            }
            setImprimiendo(false)
        }
    }

    useEffect(() => {
        if (BoxCode.length > 0) {
            getData()
        }
    }, [BoxCode])

    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='CAEX' texto2='' texto3='ReImpresion' />
            <View style={[style.textInput, { borderColor: navy }]}>

                <TextInput
                    ref={textInputRef}
                    onChangeText={(value) => { setBoxCode(value) }}
                    value={BoxCode}
                    style={style.input}
                    placeholder={'Escanear Caja...'}
                    autoFocus
                    onBlur={() => data.length == 0 ? textInputRef.current?.focus() : null}
                />
                {!cargando ?
                    <TouchableOpacity onPress={() => {

                        setBoxCode('')

                    }}>
                        <Icon name={'times'} size={15} color={black} />
                    </TouchableOpacity>
                    :
                    <ActivityIndicator size={20} />
                }

            </View>
            {
                data.length > 0 &&
                <View style={{ width: '100%' }}>
                    <View style={{ width: '100%', flexDirection: 'row', borderWidth: 1, paddingVertical: 5 }}>

                        <View style={{ flex: 1 }}>
                            <TextInput
                                value={inicio}
                                onChangeText={(value) => setInicio(value)}
                                keyboardType='decimal-pad'
                                style={{ borderWidth: 1, textAlign: 'center', borderRadius: 10, marginHorizontal: 10 }}
                            />
                            <Text style={[style.textCardBold, { textAlign: 'center' }]}>Desde</Text>
                        </View>
                        <View style={{ flex: 1 }}>

                            <TextInput
                                value={final}
                                onChangeText={(value) => setFinal(value)}
                                keyboardType='decimal-pad'
                                style={{ borderWidth: 1, textAlign: 'center', borderRadius: 10, marginHorizontal: 10 }}
                            />
                            <Text style={[style.textCardBold, { textAlign: 'center' }]}>Hasta</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    imprimirEtiquetas()
                                }}
                                disabled={imprimiendo}
                                style={{ marginHorizontal: 10, backgroundColor: navy, flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}

                            >
                                {
                                    imprimiendo ?
                                        <ActivityIndicator size={25} color={grey} />
                                        :
                                        <Icon name={'print'} size={25} color={grey} />
                                }
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={[style.textCardBold, { textAlign: 'center' }]}> Rutas: <Text style={style.textCard}>{data[0].rutas}</Text></Text>
                </View>
            }
            <View style={{ width: '100%', marginBottom: 10, flex: 1 }}>
                <FlatList
                    data={data}
                    keyExtractor={(item, index) => item.numeroPieza.toString()}
                    renderItem={({ item, index }) => renderItem(item)}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    )
}

const style = StyleSheet.create({
    textInput: {
        maxWidth: 450,
        width: '90%',
        backgroundColor: grey,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 5,
        borderWidth: 2
    },
    input: {
        width: '85%',
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

