import React, { FC, useContext, useEffect, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { WMSContext } from '../context/WMSContext'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../navigation/navigation'
import { GrupoLineasDiariointerface, LineasDiariointerface } from '../interfaces/LineasDiarioInterface';
import { WmSApi } from '../api/WMSApi'
import { grey, navy } from '../constants/Colors'

type props = StackScreenProps<RootStackParams, "IngresarLineasScreen">

export const IngresarLineasScreen: FC<props> = ({ navigation }) => {
    const { WMSState } = useContext(WMSContext)
    const [Lineas, setLineas] = useState<GrupoLineasDiariointerface[]>([])
    const [refreshing, setRefreshing] = useState<boolean>(false);

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
            })
        } catch (err) {
            console.log(err)
        }
    }

    const getCantidad = (item: LineasDiariointerface[]): number => {
        let suma: number = 0
        item.map(tmp => (
            suma += tmp.qty
        ))
        return suma
    }

    const renderItem = (item: GrupoLineasDiariointerface, index: number) => {
        const Giones = (cant: number): string => {
            let texto: string = ''
            while (cant > 0) {
                texto += '_'
                cant--
            }
            return texto
        }
        return (
            <View style={style.containerCard}>
                <View style={style.card}>
                    <View style={{ width: '80%' }}>
                        <Text style={[style.textCard, { fontWeight: 'bold' }]}>{item.items[0].itemid} *{item.items[0].inventcolorid}</Text>

                        <View style={{ width: '100%', flexDirection: 'row' }}>
                            <Text style={style.textCard}>Talla:</Text>
                            {
                                item.items.map(subitem => (
                                    <>
                                        <Text style={{color:navy}}>{Giones(4 - subitem.inventsizeid.length)}</Text>
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
                                        <Text style={{color:navy}}>{Giones(4 - subitem.qty.toString().length)}</Text>
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

    useEffect(() => {
        getData();
    }, [])
    return (
        <View style={{flex:1,width:'100%'}}>
            <Text>
                {WMSState.diario}
            </Text>
            {
                Lineas.length > 0 ?
                    <FlatList
                        data={Lineas}
                        keyExtractor={(item) => item.key}
                        renderItem={({ item, index }) => renderItem(item, index)}
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
        borderWidth: 3,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        backgroundColor: navy,
        marginHorizontal: '1%',
        marginVertical: 2,
        flexDirection: 'row'
    },
    textCard: {
        color: grey
    },
})