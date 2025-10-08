import React, { FC, useContext, useEffect, useState } from 'react'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../navigation/navigation'
import { black, blue, grey, navy } from '../../constants/Colors'
import { StyleSheet, View, Text, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator } from 'react-native'
import Header from '../../components/Header'
import { WMSContext } from '../../context/WMSContext'
import { FlatList } from 'react-native-gesture-handler'
import { WMSApiSerigrafia } from '../../api/WMSApiSerigrafia'
import { ConsultaMateriaPrimaPorOpsInteface } from '../../interfaces/Serigrafia/MateriaPrimaPorOps'
import { Icon } from 'react-native-elements'

type props = StackScreenProps<RootStackParams, "ConsultaPorBaseScreen">
export const ConsultaPorBaseScreen: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<ConsultaMateriaPrimaPorOpsInteface[]>([]);
    const [filteredData, setFilteredData] = useState<ConsultaMateriaPrimaPorOpsInteface[]>([]);
    const { changeItemId, WMSState } = useContext(WMSContext);
    const [idBusqueda, setIdBusqueda] = useState<string>('');
    const [cargando, setCargando] = useState<boolean>(true);
    const getData = async () => {
        try {
            setIdBusqueda('');
            await WMSApiSerigrafia.get<ConsultaMateriaPrimaPorOpsInteface[]>('GetConsolitadoOpsPorBase').then(resp => {
                setData(resp.data);
                setFilteredData(resp.data);
                setCargando(false);
            })
        } catch (error) {
            console.error(error)
        }
    }


    useEffect(() => {
        getData()
    }, []);


    const handleSearch = (value: string) => {
        setIdBusqueda(value);

        if (value.trim() === '') {
            setFilteredData(data); // Si está vacío, mostrar todos
        } else {
            const filtro = data.filter(item =>
                item.itemId.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredData(filtro);
        }
    };
    const redenItem = (item: ConsultaMateriaPrimaPorOpsInteface) => {
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ backgroundColor: grey, width: '95%', borderRadius: 10, margin: 2, padding: 5, borderWidth: 2, borderColor: blue }} >
                    <TouchableOpacity style={{ width: '100%' }} onPress={() => {
                        changeItemId(item.itemId);
                        navigation.navigate('MenuFlujoProcesoScreen')
                    }}>
                        <Text>Articulo: {item.itemId}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='' texto2='Consulta por Base' texto3='' />
            <View style={[style.textInput, { borderColor: '#77D970' }]}>
                <TextInput
                    onChangeText={handleSearch}
                    value={idBusqueda}
                    style={style.input}
                    placeholder='Articulo'
                    autoFocus

                />
                {!cargando ?
                    <TouchableOpacity onPress={() => getData()}>
                        <Icon name='search' size={15} color={black} />
                    </TouchableOpacity>
                    :
                    <ActivityIndicator size={20} />
                }
            </View>
            <View style={{ width: '100%', flex: 1 }}>
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.itemId}
                    renderItem={({ item, index }) => redenItem(item)}
                    refreshControl={
                        <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                    }
                    ListEmptyComponent={() => (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text >No se encontraron ordenes</Text>
                        </View>
                    )}
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
    }
})

