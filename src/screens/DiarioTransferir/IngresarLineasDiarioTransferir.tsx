import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { RootStackParams } from '../../navigation/navigation'
import { GrupoLineasDiariointerface, LineasDiariointerface } from '../../interfaces/LineasDiarioInterface'
import { WmSApi } from '../../api/WMSApi'
import { WMSContext } from '../../context/WMSContext'
import { black, blue, grey, orange } from '../../constants/Colors'
import SoundPlayer from 'react-native-sound-player'
import MyAlert from '../../components/MyAlert'
import Header from '../../components/Header'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { EnviarCorreoTransferirInterface } from '../../interfaces/EnviarCorreoTransferirInterface'


type props = StackScreenProps<RootStackParams, "IngresarLineasDiarioTransferir">

export const IngresarLineasDiarioTransferir: FC<props> = ({ navigation }) => {
    const [Lineas, setLineas] = useState<GrupoLineasDiariointerface[]>([])
    const [cargando, setCargando] = useState<boolean>(false);
    const { WMSState } = useContext(WMSContext)
    const textInputRef = useRef<TextInput>(null);
    const [barCode, setbarcode] = useState<string>('');
    const [showMensajeAlerta, setShowMensajeAlerta] = useState<boolean>(false);
    const [tipoMensaje, setTipoMensaje] = useState<boolean>(false);
    const [mensajeAlerta, setMensajeAlerta] = useState<string>('');
    const [Linea, setLinea] = useState<GrupoLineasDiariointerface>()
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [add, setAdd] = useState<boolean>(true);
    const [Enviando, setEnviando] = useState<boolean>(false)


    const getData = async () => {

        if (!cargando) {
            setCargando(true)
            try {
                await WmSApi.get<LineasDiariointerface[]>(`LineasDiario/${WMSState.diario}`).then(resp => {//WMSState.diario
                    const groupedData: { [key: string]: LineasDiariointerface[] } = {};

                    resp.data.forEach(element => {
                        const key = `${element.itemid}-${element.inventcolorid}-${element.imboxcode}`
                        if (!groupedData[key]) {
                            groupedData[key] = [];
                        }
                        groupedData[key].push(element);
                    });
                    const groupedArray: GrupoLineasDiariointerface[] = Object.keys(groupedData).map(key => ({
                        key,
                        items: groupedData[key],
                    }));
                    setLineas(groupedArray)
                })
            } catch (err) {
                console.log(err)
            }
            setCargando(false)
        }

    }

    const getCantidadTotal = (): number => {
        let suma: number = 0;
        Lineas.map(items => {
            items.items.map(item => {
                suma += item.qty
            })
        })
        return suma;
    }

    const getCantidad = (item: LineasDiariointerface[]): number => {
        let suma: number = 0
        item.map(tmp => (
            suma += tmp.qty
        ))
        return suma
    }
    const Giones = (cant: number): string => {
        let texto: string = ''
        while (cant > 0) {
            texto += '_'
            cant--
        }
        return texto
    }

    const AgregarEliminarArticulo = async (PROCESO: string) => {

        try {
            await WmSApi.get<string>(`TransferirMovimiento/${WMSState.diario}/${barCode}/${PROCESO}`).then(x => {
                if (x.data == 'OK') {
                    getData();
                } else {
                    setbarcode('')
                    setMensajeAlerta(x.data.slice(0, 120))
                    setTipoMensaje(false);
                    setShowMensajeAlerta(true);
                    try {
                        SoundPlayer.playSoundFile('error', 'mp3')
                    } catch (err) {
                        console.log('Sin sonido')
                        console.log(err)
                    }
                }
            })
            setTimeout(() => {
                textInputRef.current?.focus()
            }, 0);
        } catch (err) {
            setbarcode('')
            setMensajeAlerta('Error de envio')
            setTipoMensaje(false);
            setShowMensajeAlerta(true);
        }


    }

    const renderItem = (item: GrupoLineasDiariointerface, color: string, caja: boolean) => {

        return (
            <View style={style.containerCard} >
                <View style={[style.card, { backgroundColor: color }]}>
                    <View style={{ width: '80%' }}>
                        <Text style={[style.textCard, { fontWeight: 'bold' }]}>{item.items[0].itemid} *{item.items[0].inventcolorid}</Text>
                        {
                            caja && <Text style={style.textCard}>Caja: {item.items[0].imboxcode}</Text>
                        }
                        <View style={{ width: '100%', flexDirection: 'row' }}>
                            <Text style={style.textCard}>Talla:</Text>
                            {
                                item.items.map(subitem => (
                                    <View key={subitem.inventsizeid + 'Talla'} style={{ flexDirection: 'row' }}>
                                        <Text style={{ color: color }}>{Giones(4 - subitem.inventsizeid.length)}</Text>
                                        <Text style={style.textCard} >{subitem.inventsizeid}</Text>
                                    </View>

                                ))
                            }
                        </View>
                        <View style={{ width: '100%', flexDirection: 'row' }}>
                            <Text style={style.textCard}>QTY: </Text>
                            {
                                item.items.map(subitem => (
                                    <View key={subitem.inventsizeid + 'QTY'} style={{ flexDirection: 'row' }}>
                                        <Text style={{ color: color }} >{Giones(4 - subitem.qty.toString().length)}</Text>
                                        <Text style={style.textCard} >{-subitem.qty}</Text>
                                    </View>

                                ))
                            }
                        </View>
                    </View>
                    <View style={{ width: '19%' }}>
                        <Text style={[style.textCard, { textAlign: 'right' }]}>
                            {
                                -getCantidad(item.items)
                            }
                        </Text>
                    </View>
                </View>
            </View>
        )
    }

    const EnviarDiarioTransferir = async() => {
        if(!Enviando){
            setEnviando(true)
            try{
                await WmSApi.get<EnviarCorreoTransferirInterface>(`EnviarCorreotransferir/${WMSState.diario}/${WMSState.usuario}`).then(resp =>{
                    console.log(resp.data)
                    if(resp.data.journalID != ''){
                        navigation.goBack()
                        navigation.goBack()

                    }
                })
            }catch(err){

            }
            setEnviando(false)
        }
    }

    useEffect(() => {
        textInputRef.current?.focus()
        //textInputRef.current?.blur()
        getData();

    }, [])

    useEffect(() => {
        if (barCode.length > 0) {
            setLinea(Lineas.find(x => x.items.find(x => x.itembarcode == barCode)))
            setbarcode('')
            try {
                SoundPlayer.playSoundFile('success', 'mp3')
            } catch (err) {
                console.log('Sin sonido')
                console.log(err)
            }
        }
    }, [Lineas])

    useEffect(() => {
        if (!textInputRef.current?.isFocused()) {
            textInputRef.current?.focus()
        }

    }, [textInputRef.current?.isFocused()])

    useEffect(() => {
        if (barCode.length == 13 && !cargando && add) {
            AgregarEliminarArticulo('ADD')
        } else if (barCode.length == 13 && !cargando && !add) {
            AgregarEliminarArticulo('REMOVE')
        }
    }, [barCode])

    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1={WMSState.diario + ':' + WMSState.nombreDiario} texto2={'Articulos Ingresadas: ' + getCantidadTotal().toString()} texto3='' />
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={[style.textInput, { borderColor: add ? '#77D970' : '#CD4439' }]}>
                    <Switch value={add} onValueChange={() => setAdd(!add)}
                        trackColor={{ false: '#C7C8CC', true: '#C7C8CC' }}
                        thumbColor={add ? '#77D970' : '#CD4439'} />

                    <TextInput
                        ref={textInputRef}
                        onChangeText={(value) => { setbarcode(value) }}
                        value={barCode}
                        style={style.input}
                        //onSubmitEditing={handleEnterPress}
                        placeholder={add ? 'Escanear Ingreso...' : 'Escanear Reduccion...'}

                    />
                    {!cargando ?
                        <TouchableOpacity onPress={() => setbarcode('')}>
                            <Icon name='times' size={15} color={black} />
                        </TouchableOpacity>
                        :
                        <ActivityIndicator size={20} />
                    }

                </View>
                <TouchableOpacity onPress={!Enviando ? () => EnviarDiarioTransferir() : () => null} style={{ width: '13%', backgroundColor: '#77D970', borderRadius: 10 }} >
                    {
                        Enviando ?
                            <ActivityIndicator size={20} />
                            :
                            <Text style={{ textAlign: 'center' }}><Icon name='check' size={30} color={grey} /></Text>
                    }
                </TouchableOpacity>
            </View>



            <View style={{ width: '100%', marginBottom: 10 }}>
                {
                    Linea != null &&
                    renderItem(Linea, orange, false)
                }
            </View>
            {
                Lineas.length > 0 ?
                    <FlatList
                        data={Lineas}
                        keyExtractor={(item, index) => item.key}
                        renderItem={({ item, index }) => renderItem(item, blue, false)}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => getData()} colors={['#069A8E']} />
                        }
                        showsVerticalScrollIndicator={false}
                    />
                    :
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text >No se encontraron lineas en el diario</Text>
                    </View>
            }
            <MyAlert visible={showMensajeAlerta} tipoMensaje={tipoMensaje} mensajeAlerta={mensajeAlerta} onPress={() => { setShowMensajeAlerta(false); textInputRef.current?.focus(); }} />
        </View>
    )
}

const style = StyleSheet.create({
    containerCard: {
        width: '100%',
        alignItems: 'center',

    },
    card: {
        maxWidth: 450,
        width: '95%',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        borderStyle: 'dashed',
        marginHorizontal: '1%',
        marginVertical: 2,
        flexDirection: 'row',
    },
    textCard: {
        color: grey
    },
    textInput: {
        maxWidth: 450,
        width: '87%',
        backgroundColor: grey,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 5,
        borderWidth: 2
    },
    input: {
        width: '75%',
        textAlign: 'center'
    },

})
