import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { FlatList, Keyboard, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import { WMSContext } from '../context/WMSContext'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../navigation/navigation'
import { GrupoLineasDiariointerface, LineasDiariointerface } from '../interfaces/LineasDiarioInterface';
import { WmSApi } from '../api/WMSApi'
import { grey, navy, orange } from '../constants/Colors'
import Header from '../components/Header'

type props = StackScreenProps<RootStackParams, "IngresarLineasScreen">

export const IngresarLineasScreen: FC<props> = ({ navigation }) => {
    const { WMSState } = useContext(WMSContext)
    const [Lineas, setLineas] = useState<GrupoLineasDiariointerface[]>([])
    const [Linea, setLinea] = useState<GrupoLineasDiariointerface>()
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [barCode, setbarcode] = useState<string>('');
    const textInputRef = useRef<TextInput>(null);

    const getData = async () => {
        try {
            await WmSApi.get<LineasDiariointerface[]>(`LineasDiario/${WMSState.diario}`).then(resp => {
                const groupedData: { [key: string]: LineasDiariointerface[] } = {};

                resp.data.forEach(element => {
                    const key = `${element.itemid}-${element.inventcolorid}`
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
                setLinea(groupedArray[0])
            })
        } catch (err) {
            console.log(err)
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

    const renderItem = (item: GrupoLineasDiariointerface, index: number, color: string) => {

        return (
            <View style={style.containerCard}>
                <View style={[style.card, { backgroundColor: color }]}>
                    <View style={{ width: '80%' }}>
                        <Text style={[style.textCard, { fontWeight: 'bold' }]}>{item.items[0].itemid} *{item.items[0].inventcolorid}</Text>

                        <View style={{ width: '100%', flexDirection: 'row' }}>
                            <Text style={style.textCard}>Talla:</Text>
                            {
                                item.items.map(subitem => (
                                    <>
                                        <Text style={{ color: color }}>{Giones(4 - subitem.inventsizeid.length)}</Text>
                                        <Text style={style.textCard}>{subitem.inventsizeid}</Text>
                                    </>

                                ))
                            }
                        </View>
                        <View style={{ width: '100%', flexDirection: 'row' }}>
                            <Text style={style.textCard}>QTY:  </Text>
                            {
                                item.items.map(subitem => (
                                    <>
                                        <Text style={{ color: color }}>{Giones(4 - subitem.qty.toString().length)}</Text>
                                        <Text style={style.textCard}>{subitem.qty}</Text>
                                    </>

                                ))
                            }
                        </View>
                    </View>
                    <View style={{ width: '19%' }}>
                        <Text style={[style.textCard, { textAlign: 'right' }]}>
                            {
                                getCantidad(item.items)
                            }
                        </Text>
                    </View>
                </View>
            </View>
        )
    }

    const handleEnterPress = () => {

        setbarcode('')

        setTimeout(() => {
            textInputRef.current?.focus();
        }, 0);
       

        setLinea(Lineas[2])
        
    }

    useEffect(() => {
        textInputRef.current?.focus()
        getData();

    }, [])



    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1={WMSState.diario + ':' + WMSState.nombreDiario} texto2={'Lineas Ingresadas: ' + getCantidadTotal().toString()} />
            <View style={style.textInput}>
                <TextInput
                    ref={textInputRef}
                    onChangeText={(value) => setbarcode(value)}
                    value={barCode}
                    style={style.input}
                    onSubmitEditing={handleEnterPress}
                    placeholder="Escanear producto..."

                />
            </View>
            <View style={{ width: '100%', marginBottom: 10 }}>
                {
                    Linea &&
                    renderItem(Linea, 1000, orange)
                }
            </View>
            {
                Lineas.length > 0 ?
                    <FlatList
                        data={Lineas}
                        keyExtractor={(item) => item.key}
                        renderItem={({ item, index }) => renderItem(item, index, navy)}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => getData()} colors={['#069A8E']} />
                        }
                    />
                    :
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text >No se encontraron lineas en el diario</Text>
                    </View>
            }
        </View>
    )
}
const style = StyleSheet.create({
    containerCard: {
        width: '100%',
        alignItems: 'center'
    },
    card: {
        maxWidth: 450,
        width: '90%',

        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,

        marginHorizontal: '1%',
        marginVertical: 2,
        flexDirection: 'row'
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