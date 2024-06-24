import React, { FC, useContext, useEffect, useState } from 'react'
import { WMSContext } from '../../context/WMSContext';
import { DiariosAbriertosinterface } from '../../interfaces/DiariosAbiertosInterface';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParams } from '../../navigation/navigation';
import { WmSApi } from '../../api/WMSApi';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5'
import Header from '../../components/Header';
import { blue, grey, navy } from '../../constants/Colors';


type props = StackScreenProps<RootStackParams, "SeleccionarDiarioTransferirScreen">

export const SeleccionarDiarioTransferirScreen: FC<props> = ({ navigation }) => {
    const { WMSState, changeDiario, changeNombreDiario } = useContext(WMSContext);
    const [cargando, setCargando] = useState<boolean>(false);
    const [Diarios, setDiarios] = useState<DiariosAbriertosinterface[]>([]);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [filtro, setFiltro] = useState<string>('')


    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<DiariosAbriertosinterface[]>(`DiariosTransferirAbiertos/24402/-`).then(resp => {
                setDiarios(resp.data)
                
            })
        } catch (err) {
            console.log(err)
        }
        setCargando(false)
    }

    const renderItem = (item: DiariosAbriertosinterface, index: number) => {
        const onPress = (item2: DiariosAbriertosinterface) => {
            changeDiario(item2.journalid)
            changeNombreDiario(item2.journalnameid)
            navigation.navigate('IngresarLineasDiarioTransferir')
        }
        return (
            <View style={style.containerCard}>
                <TouchableOpacity style={style.card} onPress={() => onPress(item)}>
                    <View style={{ width: '100%', flexDirection: 'row' }}>
                        <View style={{ width: '80%' }}>
                            <Text style={[style.textCard, { fontWeight: 'bold' }]}>{item.journalid}: {item.journalnameid}</Text>
                            <Text style={style.textCard}> {item.description}</Text>
                        </View>
                        <View style={{ width: '20%', alignItems: 'center' }}>
                            <Icon name='box-open' size={30} color={grey} />
                        </View>
                    </View>
                    <View style={{ width: '100%', alignItems: 'flex-end' }}>
                        <Text style={style.textCard}> QTY: {item.numoflines}</Text>
                    </View>
                </TouchableOpacity >
            </View >
        )
    }

    useEffect(() => {
        getData();
    }, [])
    return (
        <View style={style.container}>
            <Header texto1='' texto2='Seleccione Diario Transferir' texto3=''/>
            <View style={style.textInput}>
                <TextInput
                    placeholder='DIA-XXXXXX'
                    placeholderTextColor={'#fff'}
                    onChangeText={(value) => setFiltro(value)}
                    value={filtro}
                    style={style.input}
                />
                <TouchableOpacity onPress={getData}>
                    <Icon name='search' size={20} color={navy} />
                </TouchableOpacity>
            </View>
            {
                cargando ?
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator color={navy} size={'large'} />
                        <Text>Cargando informacion...</Text>
                    </View>
                    :
                    Diarios.length > 0 ?
                        <FlatList
                            data={Diarios}
                            keyExtractor={(item) => item.journalid.toString()}
                            renderItem={({ item, index }) => renderItem(item, index)}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={() => getData()} colors={['#069A8E']} />
                            }
                            showsVerticalScrollIndicator={false}
                        />
                        :
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text >No se encontraron diarios abiertos</Text>
                        </View>
            }
        </View>
    )
}

const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: grey,
        alignItems: 'center'
    },
    containerCard: {
        width: '100%',
        alignItems: 'center'
    },
    card: {
        maxWidth: 450,
        width: '90%',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        backgroundColor: blue,
        marginHorizontal: '1%',
        marginVertical: 2,

    },
    textCard: {
        color: grey
    },
    textInput: {
        maxWidth: 450,
        width: '90%',
        backgroundColor: grey,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 5,
        borderWidth: 1
    },
    input: {
        width: '90%',
        textAlign: 'center'
    }
})

