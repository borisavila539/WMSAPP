import React, { FC, useContext, useEffect, useState } from 'react'
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { WmSApi } from '../../../api/WMSApi'
import { ConsultaOPDetalleCajasInterface, ConsultaOPDetalleInterface, GrupoConsultaOPDetalleInterface } from '../../../interfaces/DespachoPT/ConsultaOP/ConsultaOPDetalleInterface'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../../../navigation/navigation'
import Header from '../../../components/Header'
import { WMSContext } from '../../../context/WMSContext'
import { green, grey, navy } from '../../../constants/Colors'



type props = StackScreenProps<RootStackParams, "DespachoPTConsultaOPDetalle">

export const DespachoPTConsultaOPDetalle: FC<props> = ({ navigation }) => {
    const { WMSState } = useContext(WMSContext)
    const [despachoID, setDepachoID] = useState<number>(0)
    const [ProdCutSheetID, setProdCutSheetID] = useState<string>('')
    const [ModalVisible, setModalVisible] = useState<boolean>(false)
    const [data, setData] = useState<GrupoConsultaOPDetalleInterface[]>([])
    const [cajas, SetCajas] = useState<ConsultaOPDetalleCajasInterface[]>([])

    const getData = async () => {
        try {
            await WmSApi.get<ConsultaOPDetalleInterface[]>(`ConsultaOPDetalle/${WMSState.ProdID}`).then(resp => {
                //console.log(resp.data)
                const groupedData: { [key: string]: ConsultaOPDetalleInterface[] } = {};

                resp.data.forEach(element => {
                    const key = `${element.prodCutSheetID}-Despacho #${element.despachoID}`
                    if (!groupedData[key]) {
                        groupedData[key] = [];
                    }
                    groupedData[key].push(element);
                });
                const groupedArray: GrupoConsultaOPDetalleInterface[] = Object.keys(groupedData).map(key => ({
                    key,
                    items: groupedData[key],
                }));
                setData(groupedArray)
            })
        } catch (err) {
            console.log(err)
        }
    }

    const getCajas = async () => {
        try {
            await WmSApi.get<ConsultaOPDetalleCajasInterface[]>(`ConsultaOPDetalleCajas/${ProdCutSheetID}/${despachoID}`).then(resp => {
                SetCajas(resp.data)
                setModalVisible(true)
            })
        } catch (err) {

        }
    }

    useEffect(()=>{
        if(ProdCutSheetID.length>0 && despachoID > 0){
            getCajas()
        }
    },[ProdCutSheetID,despachoID])

    const renderItem = (item: GrupoConsultaOPDetalleInterface) => {
        const onPress = () => {
            setDepachoID(item.items[0].despachoID)
            setProdCutSheetID(item.items[0].prodCutSheetID)
            getCajas()
        }
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>

                <TouchableOpacity onPress={onPress} style={{ width: '95%', borderWidth: 1, borderRadius: 5, padding: 2, alignItems: 'center' }}>
                    <Text>{item.key}</Text>
                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, padding: 2, width: '95%', marginBottom: 2 }}>
                        <View style={[styles.box, { borderStartWidth: 1 }]}>
                            <Text>Talla</Text>
                        </View>
                        <View style={styles.box}>
                            <Text>Corte</Text>
                        </View>
                        <View style={styles.box}>
                            <Text>1era</Text>
                        </View>
                        <View style={styles.box}>
                            <Text>2da</Text>
                        </View>
                        <View style={styles.box}>
                            <Text>3era</Text>
                        </View>
                        <View style={styles.box}>
                            <Text>Cajas</Text>
                        </View>
                    </View>

                    {
                        item.items.map(element => (
                            <View style={{ flexDirection: 'row', padding: 2, width: '95%', marginBottom: 2 }}>
                                <View style={[styles.box, { borderStartWidth: 1 }]}>
                                    <Text>{element.size}</Text>
                                </View>
                                <View style={styles.box}>
                                    <Text>{element.cortado}</Text>
                                </View>
                                <View style={styles.box}>
                                    <Text>{element.receive}</Text>
                                </View>
                                <View style={styles.box}>
                                    <Text>{element.segundas}</Text>
                                </View>
                                <View style={styles.box}>
                                    <Text>{element.terceras}</Text>
                                </View>
                                <View style={styles.box}>
                                    <Text>{element.cajas}</Text>
                                </View>
                            </View>
                        ))
                    }
                </TouchableOpacity>
            </View>
        )
    }

    const renderCajas = (item: ConsultaOPDetalleCajasInterface) => {
        return (
            <View style={{ width: '100%', alignItems: 'center', borderWidth: 1, flexDirection: 'row' }}>

                <View style={styles.box} >
                    <Text style={styles.text}>{item.size}</Text>
                </View>
                <View style={styles.box}>
                    <Text style={styles.text}>{item.box}</Text>
                </View>
                <View style={styles.box}>
                    <Text style={styles.text}>{item.qty}</Text>
                </View>

            </View>
        )
    }

    useEffect(() => {
        getData()
    }, [])
    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='' texto2='Consulta OP' texto3='' />
            <View style={{ width: '100%', paddingTop: 5 }}>
                <FlatList
                    data={data}
                    keyExtractor={(item, index) => item.key}
                    renderItem={({ item, index }) => renderItem(item)}
                    refreshControl={
                        <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                    }
                    showsVerticalScrollIndicator={false}
                />
            </View>
            <Modal visible={ModalVisible && cajas.length > 0} transparent={true}>
                <View style={styles.modal}>
                    <View style={styles.constainer}>
                        <View style={{ width: '100%', alignItems: 'center', borderWidth: 1, flexDirection: 'row' }}>
                            <View style={styles.box} >
                                <Text style={[styles.text,{fontWeight: 'bold'}]}>Talla</Text>
                            </View>
                            <View style={styles.box}>
                                <Text style={[styles.text,{fontWeight: 'bold'}]}>Caja</Text>
                            </View>
                            <View style={styles.box}>
                                <Text style={[styles.text,{fontWeight: 'bold'}]}>Cant</Text>
                            </View>
                        </View>
                        <View style={{ width: '100%' }}>
                            <FlatList
                                data={cajas}
                                keyExtractor={(item, index) => item.size + '-' + item.box}
                                renderItem={({ item, index }) => renderCajas(item)}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>

                        <Pressable onPress={() => setModalVisible(false)} style={styles.pressable}>
                            <Text style={[styles.text, { color: grey, marginTop: 0 }]}>Ok</Text>
                        </Pressable>

                    </View>
                </View>
            </Modal>

        </View >
    )
}

const styles = StyleSheet.create({
    box: {
        flex: 1,
        alignItems: 'center',
        borderEndWidth: 1,
    },
    modal: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        backgroundColor: '#00000099',
    },
    constainer: {
        width: '80%',
        backgroundColor: grey,
        alignItems: 'center',
        borderRadius: 10,
        paddingVertical: 15,
        paddingHorizontal: 20,
        maxHeight: 300
    },
    pressable: {
        backgroundColor: '#0078AA',
        paddingVertical: 7,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginTop: 15
    },
    text: {
        marginTop: 10,
        color: navy
    },
})
