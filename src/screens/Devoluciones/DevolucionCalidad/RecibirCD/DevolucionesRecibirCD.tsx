import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { RootStackParams } from '../../../../navigation/navigation'
import { Caja, DevolucionesInterface, EnviarDevolucionInterface } from '../../../../interfaces/Devoluciones/Devoluciones';
import { WMSContext } from '../../../../context/WMSContext';
import { WmSApi } from '../../../../api/WMSApi';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Header from '../../../../components/Header';
import { black, green, grey, orange } from '../../../../constants/Colors';
import Icon from 'react-native-vector-icons/FontAwesome5'
import SoundPlayer from 'react-native-sound-player';

type props = StackScreenProps<RootStackParams, "DevolucionesRecibirCD">
export const DevolucionesRecibirCD: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<EnviarDevolucionInterface[]>([])
    const [cargando, setCargando] = useState<boolean>(false)
    const [escanenado, setEscaneando] = useState<boolean>(false)
    const { WMSState, changeDevolucion } = useContext(WMSContext)
    const textInputRef = useRef<TextInput>(null);
    const [CajaS, setCajaS] = useState<string>('')


    const getData = async () => {
        if (!cargando) {
            setCargando(true)
            try {
                await WmSApi.get<EnviarDevolucionInterface[]>('Devolucion/EnviadasCD')
                    .then(resp => {
                        setData(resp.data)
                        //console.log(resp.data)
                    })
            } catch (err) {
                Alert.alert('err')
            }
            setCargando(false)
        }
    }

    const onPress = (item: EnviarDevolucionInterface) => {
        changeDevolucion(item)
        navigation.navigate('DevolucionRecibirCDDetalle')
    }
    const renderItem = (item: EnviarDevolucionInterface) => {
        const cantidad = (): number => {
            let cant = 0
            item.cajas.forEach(ele => {
                if (ele.recibir) {
                    cant++;
                }
            })
            return cant;
        }
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <TouchableOpacity disabled={cantidad() != item.cajas.length} onPress={() => onPress(item)} style={{ width: '95%', borderWidth: 1, borderRadius: 15, paddingVertical: 5, paddingHorizontal: 10, marginTop: 5 }} >
                    <View style={{ width: '100%', justifyContent: 'space-between', flexDirection: 'row' }}>
                        <Text style={{ fontWeight: 'bold' }}>{item.numDevolucion}</Text>
                        <Text style={{ fontWeight: 'bold' }}>{item.numeroRMA}</Text>
                        <Text style={{ fontWeight: 'bold' }}>{cantidad()}/{item.cajas.length}</Text>
                    </View>
                    <FlatList
                        data={item.cajas}
                        keyExtractor={(item) => item.caja.toString()}
                        renderItem={({ item, index }) => renderItemCajas(item)}
                        numColumns={6}
                    />

                </TouchableOpacity>
            </View>
        )
    }

    const renderItemCajas = (item: Caja) => {
        return (

            <View style={{ flex: 1, alignItems: 'center', borderRadius: 5, margin: 2 }}>
                <Icon name='box-open' size={40} color={item.recibir ? green : orange} />
                <Text style={{ fontWeight: 'bold', position: 'absolute', top: 17, color: grey }}>{item.caja}</Text>
            </View>

        )
    }

    const AgregarCaja = async () => {
        setEscaneando(true)
        try {
            let texto: string[] = CajaS.split(',');
            if (texto[0] == "CONSOLIDADO") {
                await WmSApi.get<Caja[]>(`Devolucion/PackingRecibirCajaConsolidada/${texto[1]}/${WMSState.usuario}/Recibir`)
                    .then(resp => {
                        if (resp.data[0].packing) {
                            PlaySound('success')

                        } else {
                            PlaySound('error')

                        }
                        getData()
                    })
            } else {
                await WmSApi.get<Caja>(`Devolucion/IngresoCajasRecibir/${texto[0]}/${WMSState.usuario}/${texto[1]}`)
                    .then(resp => {
                        if (resp.data.packing) {
                            PlaySound('success')

                        } else {
                            PlaySound('error')

                        }
                        getData()
                    })
            }


        } catch (err) {
            Alert.alert('err')
        }
        setEscaneando(false)
        setCajaS('')

        setTimeout(() => {
            textInputRef.current?.focus()
        }, 0);
    }

    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }



    useEffect(() => {
        textInputRef.current?.focus()
        getData()
    }, [])

    useEffect(() => {

        if (CajaS.length > 0) {
            AgregarCaja()
        }

    }, [CajaS])
    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey }}>
            <Header texto1='Devoluciones' texto2='Enviar' texto3='' />
            <View style={{ width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'space-evenly' }}>
                <View style={[style.textInput, { borderColor: '#77D970' }]}>
                    <TextInput
                        ref={textInputRef}
                        onChangeText={(value) => { setCajaS(value) }}
                        value={CajaS}
                        style={style.input}
                        placeholder='Devolucion'
                        autoFocus

                    />

                    {
                        escanenado &&
                        <ActivityIndicator size={20} />
                    }
                </View>

            </View>

            <FlatList
                data={data}
                keyExtractor={(item) => item.numDevolucion}
                renderItem={({ item, index }) => renderItem(item)}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={cargando} onRefresh={() => getData()} colors={['#069A8E']} />
                }
            />

        </View>
    )
}

const style = StyleSheet.create({
    textInput: {
        maxWidth: 450,
        width: '84%',
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
    }
})