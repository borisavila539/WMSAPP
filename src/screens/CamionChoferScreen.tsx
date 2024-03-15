import React, { FC, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Header from '../components/Header'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../navigation/navigation'
import { RefreshControl, TextInput } from 'react-native-gesture-handler'
import { black, blue, grey, orange } from '../constants/Colors'
import MyAlert from '../components/MyAlert'
import { WMSContext } from '../context/WMSContext'
import { WmSApi } from '../api/WMSApi'
import { DespachoCamionInterface } from '../interfaces/DespachoCamionInterface'
import Icon from 'react-native-vector-icons/FontAwesome5'
//import RNPrint from 'react-native-print';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

type props = StackScreenProps<RootStackParams, "CamionChoferScreen">


export const CamionChoferScreen: FC<props> = ({ navigation }) => {
    const [camion, setCamion] = useState<string>('')
    const [Chofer, setChofer] = useState<string>('')
    const [showMensajeAlerta, setShowMensajeAlerta] = useState<boolean>(false);
    const [tipoMensaje, setTipoMensaje] = useState<boolean>(false);
    const [mensajeAlerta, setMensajeAlerta] = useState<string>('');
    const { changeCamion, changeChofer, WMSState, changeDespachoID } = useContext(WMSContext)
    const [data, setData] = useState<DespachoCamionInterface[]>([])
    const [cargando, setCargando] = useState<boolean>(false);
    const [DespachoID, setDespachoID] = useState<number>(0);
    const onPress = async () => {

        if (camion != '' && Chofer != '') {
            changeCamion(camion)
            changeChofer(Chofer)
            try {
                await WmSApi.get<DespachoCamionInterface[]>(`CrearDespacho/${WMSState.recID}/${Chofer}/${camion}`).then(x => {
                    changeDespachoID(x.data[0].id)
                })
            } catch (err) {
                console.log(err)
            }
            navigation.navigate('TelaPackingScreen')
        } else {
            setMensajeAlerta('Campo ' + (camion == '' ? 'Camion' : 'Chofer') + ' es obligatorio')
            setTipoMensaje(false)
            setShowMensajeAlerta(true)
        }
    }

    const imprimirRemision = async (item: DespachoCamionInterface) => {
        setDespachoID(item.id)
        setCargando(true)

        let htmlContent = '';

        try {
            await WmSApi.get<string>(`NotaDespacho/${item.id}/${item.recIDTraslados}/${item.chofer}/${item.camion}`).then(resp => {
                htmlContent = resp.data
            })
        } catch (err) {
            console.log(err)
        }
        try {
            const results = await RNHTMLtoPDF.convert({
                html: htmlContent,
                fileName: 'test',
                base64: true,
            });

            const options = {
                url: `data:application/pdf;base64,${results.base64}`,
                type: 'application/pdf',
                fileName: 'test.pdf',
            };

            await Share.open(options);
        } catch (err) {

        }

        setCargando(false)

    }

    const getData = async () => {
        await WmSApi.get<DespachoCamionInterface[]>(`ObternerDespacho/${WMSState.recID}`).then(resp => {
            console.log(resp.data)
            setData(resp.data)
        })
    }

    const renderItem = (item: DespachoCamionInterface) => {
        const onPressList = () => {
            if (!item.estado) {
                changeCamion(item.camion)
                changeChofer(item.chofer)
                changeDespachoID(item.id)
                navigation.navigate('TelaPackingScreen')
            }

        }

        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', backgroundColor: grey, width: '95%', borderRadius: 10, margin: 2, padding: 5, borderWidth: 2, borderColor: (item.estado ? blue : '#6BCB77') }} >
                    <TouchableOpacity style={{ width: '80%' }} onPress={onPressList}>
                        <Text>Despacho: {item.id.toString().padStart(8, '0')}</Text>
                        <Text>Motorista: {item.chofer} / {item.camion}</Text>
                    </TouchableOpacity>
                    {
                        cargando && DespachoID == item.id ?
                            item.estado &&
                            <ActivityIndicator size={20} />
                            :
                            <TouchableOpacity style={{ width: '19%' }} onPress={() => imprimirRemision(item)}>
                                <Icon name='print' size={30} color={blue} />
                            </TouchableOpacity>
                    }


                </View>
            </View>
        )
    }

    useEffect(() => {
        getData()
    }, [])

    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1={WMSState.TRANSFERIDFROM + '-' + WMSState.TRANSFERIDTO} texto2='' texto3='' />
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
                <Text style={{ color: grey }}>Crear Despacho</Text>
            </TouchableOpacity>

            <MyAlert visible={showMensajeAlerta} tipoMensaje={tipoMensaje} mensajeAlerta={mensajeAlerta} onPress={() => setShowMensajeAlerta(false)} />
            <View style={{ width: '100%', marginTop: 5, flex: 1 }}>
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id.toString()}
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
