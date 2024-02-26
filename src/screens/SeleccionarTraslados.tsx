import React, { FC, useCallback, useContext, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native'
import Header from '../components/Header'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../navigation/navigation'
import { black, blue, grey } from '../constants/Colors'
import { TrasladosInterface } from '../interfaces/Trasladosinterface'
import { WmSApi } from '../api/WMSApi'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { WMSContext } from '../context/WMSContext'


type props = StackScreenProps<RootStackParams, 'Seleccionartraslados'>

export const SeleccionarTrasladosScreen: FC<props> = ({ navigation }) => {
    const [Almacen, setAlmacen] = useState<string>('')
    const [data, setData] = useState<TrasladosInterface[]>([])
    const [cagando, setCargando] = useState<boolean>(false)
    const { changeINVENTLOCATIONIDTO, changeTRANSFERIDFROM, changeTRANSFERIDTO } = useContext(WMSContext)


    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<TrasladosInterface[]>(`TrasladosAbiertos/${Almacen}`).then(resp => {
                setData(resp.data)
            })
        } catch (err) {

        }
        setCargando(false)
    }

    const onPress = (item: TrasladosInterface) => {
        console.log(item.inventlocationidto)
        changeINVENTLOCATIONIDTO(item.inventlocationidto)
        changeTRANSFERIDFROM(item.transferidfrom)
        changeTRANSFERIDTO(item.transferidto)
        navigation.navigate('TelaOptionScreen')
    }

    const renderItem = (item: TrasladosInterface) => {

        return (
            <View style={{ width: '100%', alignItems: 'center' }}>

                <TouchableOpacity onPress={() => onPress(item)} style={{ width: '95%', borderRadius: 15, padding: 10, backgroundColor: blue, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: '85%', alignItems: 'center' }}>
                        <Text style={{ color: grey }}>{item.transferidfrom}-{item.transferidfrom}</Text>
                        <Text style={{ color: grey }}>{item.description}</Text>
                    </View>
                    <View style={{ width: '15%' }}>
                        <Icon name='truck-moving' size={25} color={grey} />
                    </View>
                </TouchableOpacity>
            </View>
        )
    }
    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='' texto2='Seleccionar Traslado' texto3='' />

            <View style={style.textInput}>
                <TextInput
                    onChangeText={(value) => { setAlmacen(value) }}
                    value={Almacen}
                    style={style.input}
                    placeholder='Almacen'
                />
                {
                    !cagando ?
                        <TouchableOpacity onPress={() => getData()}>
                            <Icon name='search' size={15} color={black} />
                        </TouchableOpacity>
                        :
                        <ActivityIndicator size={20} />
                }

            </View>
            <View style={{ flex: 1, width: '100%' }}>
                {
                    data.length > 0 &&
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item.transferidfrom + "-" + item.transferidto}
                        renderItem={({ item, index }) => renderItem(item)}
                    />
                }
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
