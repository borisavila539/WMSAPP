import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { RootStackParams } from '../../navigation/navigation'
import Header from '../../components/Header'
import { black, grey, orange } from '../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { DropDownListInterface } from '../../interfaces/DropDownListInterface'
import { Dropdown } from 'react-native-element-dropdown'
import { BusquedaRolloAXInterface } from '../../interfaces/BusquedaRolloAX/BusquedaRolloAXinterface'
import { WmSApi } from '../../api/WMSApi'


type props = StackScreenProps<RootStackParams, "BusquedaRolloAXScreen">

export const BusquedaRolloAXScreen: FC<props> = ({ navigation }) => {
    const [almacen, setAlmacen] = useState<string>('')
    const [filtro, setFiltro] = useState<string>('')
    const [cargando, setCargando] = useState<boolean>(false)
    const [selected, setSelected] = useState<string>('1')
    const [Rollos, setRollos] = useState<BusquedaRolloAXInterface[]>([])
    const [ancho, setAncho] = useState<string>('')

    const data: DropDownListInterface[] = [
        { label: 'Rollo', value: '1' },
        { label: 'Importacion', value: '2' },
        { label: 'Color', value: '3' },
        { label: 'Ubicacion', value: '4' },
        { label: 'Referencia Tela', value: '5' }
    ];
    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<BusquedaRolloAXInterface[]>(`BusquedaRollosAX/${almacen}/${selected == '1' ? filtro : '-'}/${selected == '2' ? filtro : '-'}/${selected == '3' ? filtro : '-'}/${selected == '4' ? filtro : '-'}/${selected == '5' ? filtro : '-'}`)
                .then(resp => {
                    setRollos(resp.data)
                })
        } catch (err) {
            console.log(err)
        }
        setCargando(false)

    }

    const renderItem = (item: BusquedaRolloAXInterface) => {
        return (
            <View style={{ width: '49%', alignItems: 'center' }}>
                <View style={{ width: '95%', backgroundColor: orange, borderRadius: 10, marginBottom: 5, padding: 5 }}>
                    <Text style={[style.textRender, { fontWeight: 'bold' }]}>{item.inventserialid}</Text>
                    <Text style={style.textRender}>PR: {item.apvendroll}</Text>
                    <Text style={style.textRender}>Color: {item.colorname} {'(' + item.inventcolorid + ')'}</Text>
                    <Text style={style.textRender}>{item.itemid}</Text>
                    <Text style={style.textRender}>{item.inventbatchid}</Text>
                    <Text style={style.textRender}>QTY: {item.physicalinvent}</Text>
                    <Text style={style.textRender}>Ubicacion: {item.wmslocationid}</Text>
                    <Text style={style.textRender}>Referencia: {item.reference}</Text>
                    <Text style={style.textRender}>Ancho: {item.configid}</Text>
                </View>
            </View>
        )
    }

    useEffect(() => {
        getData();
    }, [])
    return (
        <View style={{ flex: 1, alignItems: 'center' }}>
            <Header texto1='Busqueda' texto2={'Encontrado: ' + Rollos.length} texto3='' />
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
                <View style={style.textInput}>
                    <TextInput
                        onChangeText={(value) => { setAlmacen(value) }}
                        value={almacen}
                        style={[style.input, { width: '100%' }]}
                        placeholder='Almacen'
                    />
                </View>
                <Dropdown
                    data={data}
                    value={selected}
                    labelField="label"
                    valueField="value"
                    onChange={item => {
                        setSelected(item.value);
                        setFiltro('')
                    }}
                    style={style.dropdown}
                />
            </View>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>

                <View style={style.textInput}>
                    <TextInput
                        onChangeText={(value) => { setAncho(value) }}
                        value={ancho}
                        style={style.input}
                        placeholder='ancho'
                    />                  

                </View>
                <View style={style.textInput}>
                    <TextInput
                        onChangeText={(value) => { setFiltro(value) }}
                        value={filtro}
                        style={style.input}
                        placeholder={data.find(x => x.value == selected)?.label}
                    />
                    {
                        !cargando ?
                            <TouchableOpacity onPress={() => getData()}>
                                <Icon name='search' size={15} color={black} />
                            </TouchableOpacity>
                            :
                            <ActivityIndicator size={20} />
                    }

                </View>
            </View>

            <View style={{ flex: 1, width: '100%' }}>

                <FlatList
                    data={(ancho.length > 0 ? Rollos.filter(x => x.configid == ancho) : Rollos)}
                    keyExtractor={(item) => item.inventserialid.toString()}
                    renderItem={({ item }) => renderItem(item)}
                    refreshControl={
                        <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                    }
                    numColumns={2}
                />
            </View>

        </View>
    )
}

const style = StyleSheet.create({
    textInput: {
        maxWidth: 450,
        width: '49%',
        backgroundColor: grey,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 5,
        borderWidth: 2,
        marginLeft: 1
    },
    input: {
        width: '90%',
        textAlign: 'center'
    },
    dropdown: {
        width: '49%',
        height: 50,
        borderWidth: 2,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginLeft: 1
    },
    textRender: {
        color: grey
    }
})