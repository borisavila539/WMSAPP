import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { RootStackParams } from '../../../navigation/navigation'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Header from '../../../components/Header'
import { black, green, grey, orange, yellow } from '../../../constants/Colors'
import { WMSContext } from '../../../context/WMSContext'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { DespachoPTDetalleAuditoriaCajaInterface } from '../../../interfaces/DespachoPT/Auditar/DespachoPTCajasAuditarInterface'
import { WmSApi } from '../../../api/WMSApi'
import SoundPlayer from 'react-native-sound-player'
import { AuditoriaCajaDenimInsertInterface } from '../../../interfaces/AuditoriaCajaDenim/AuditoriaCajaDenimInterface'

type props = StackScreenProps<RootStackParams, "DespachoPTAuditoriaCajasLineas">

export const DespachoPTAuditoriaCajasLineas: FC<props> = ({ navigation }) => {
    const { WMSState } = useContext(WMSContext)
    const [QR, setQR] = useState<string>('')
    const textInputRef = useRef<TextInput>(null);
    const [cargando, setCargando] = useState<boolean>(false);
    const [data, setData] = useState<DespachoPTDetalleAuditoriaCajaInterface[]>([])
    const [multiplo, setMultiplo] = useState<string>('3');

    const articuloAuditado = async () => {
        let texto = QR.split(',')
        if (data[0].itemID == texto[0] && data[0].size == texto[1] && data[0].color == texto[2] && multiplo == texto[6]) {
            try {
                await WmSApi.get<AuditoriaCajaDenimInsertInterface>(`InsertAuditoriaCajaTP/${WMSState.ProdID}/${WMSState.Box}/${texto[7]}/${texto[6]}`).then(resp => {
                    console.log(resp.data)
                    if (resp.data.response == "OK") {
                        PlaySound('success')
                    } else {
                        PlaySound('repeat')

                    }
                })
            } catch (err) {
                PlaySound('error')
                console.log(err)

            }
        } else {
            PlaySound('error')
        }
        setQR('')
        getData()
    }

    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }



    const getData = async () => {
        try {
            await WmSApi.get<DespachoPTDetalleAuditoriaCajaInterface[]>(`DetalleAuditoriaCaja/${WMSState.ProdID}/${WMSState.Box}`).then(resp => {
                setData(resp.data)
            })
        } catch (err) {

        }
    }

    const renderItem = (item: DespachoPTDetalleAuditoriaCajaInterface) => {
        const getColor = (): string => {
            if (item.auditada == 0) {
                return grey
            } else if (item.auditada <= (item.qty / 2)) {
                return yellow
            } else if (item.auditada > (item.qty / 2) && item.auditada < item.qty) {
                return orange
            } else {
                return green
            }
        }
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ width: '95%', borderRadius: 10, backgroundColor: getColor(), marginBottom: 5, padding: 5, borderWidth: 1 }}>
                    <Text style={style.textRender}>{item.itemID} {item.color}</Text>
                    <Text style={style.textRender}>Talla: {item.size}</Text>
                    <Text style={style.textRender}>QTY: {item.qty}</Text>
                    <Text style={style.textRender}>Auditada: {item.auditada}</Text>


                </View>
            </View >
        )
    }


    useEffect(() => {
        getData()
    }, [])

    useEffect(() => {
        if (QR.length > 0) {
            articuloAuditado()
            textInputRef.current?.blur()
        }
    }, [QR])

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='' texto2={WMSState.ProdID + ', ' + WMSState.Box} texto3='' />
            <View style={[style.textInput, { borderColor: '#77D970' }]}>
                <TextInput
                    ref={textInputRef}
                    onChangeText={(value) => { setQR(value); console.log(value) }}
                    value={QR}
                    style={style.input}
                    placeholder='Escanear Articulo...'
                    autoFocus
                    onBlur={() => textInputRef.current?.isFocused() ? null : textInputRef.current?.focus()}

                />
                {!cargando ?
                    <TouchableOpacity onPress={() => setQR('')}>
                        <Icon name='times' size={15} color={black} />
                    </TouchableOpacity>
                    :
                    <ActivityIndicator size={20} />
                }
            </View>
            <View style={{ flexDirection: 'row', width: '100%', alignContent: 'space-between', justifyContent: 'space-between' }}>
                <TouchableOpacity style={{ borderWidth: 1, borderRadius: 5, margin: 1, width: '30%', alignItems: 'center', padding: 5, backgroundColor: (multiplo == '1' ? green : grey) }}
                    onPress={() => setMultiplo('1')}
                >
                    <Text style={{ fontWeight: 'bold' }}>1</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ borderWidth: 1, borderRadius: 5, margin: 1, width: '30%', alignItems: 'center', padding: 5, backgroundColor: (multiplo == '3' ? green : grey) }}
                    onPress={() => setMultiplo('3')}
                >
                    <Text style={{ fontWeight: 'bold' }}>3</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ borderWidth: 1, borderRadius: 5, margin: 1, width: '30%', alignItems: 'center', padding: 5, backgroundColor: (multiplo == '6' ? green : grey) }}
                    onPress={() => setMultiplo('6')}
                >
                    <Text style={{ fontWeight: 'bold' }}>6</Text>
                </TouchableOpacity>
            </View>
            <View style={{ flex: 1, width: '100%' }}>
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.itemID.toString()}
                    renderItem={({ item, index }) => renderItem(item)}
                    refreshControl={
                        <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                    }
                />
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
        color: black
    }
})
