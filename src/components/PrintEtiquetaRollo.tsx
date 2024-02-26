import React, { useContext, useEffect, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { black, grey, navy } from '../constants/Colors'
import { PrinterInterface, PrintersInterface } from '../interfaces/PrintersInterface'
import { WmSApi } from '../api/WMSApi';
import { WMSContext } from '../context/WMSContext';
import Icon from 'react-native-vector-icons/FontAwesome5'
import { PinterEtiquetaRolloInterface } from '../interfaces/PrinterEtiquetaRollo';
import { EtiquetaRolloInterface } from '../interfaces/EtiquetaRolloInterface';

function PrintEtiquetaRollo ({showImpresoras,data,onPress}:PinterEtiquetaRolloInterface){
    const [Impresoras, setImpresoras] = useState<PrinterInterface[]>([]);
    const { WMSState } = useContext(WMSContext)

    const getImpresoras = async () => {
        try {
            await WmSApi.get<PrinterInterface[]>('Impresoras').then(resp => {
                setImpresoras(resp.data)


            })
        } catch (err) {
            console.log(err)
        }
    }

    const onSelectPrint = async (item: PrinterInterface) => {
        data.print = item.iM_IPPRINTER;
        let datos:EtiquetaRolloInterface[]=[]
        datos.push(data)
        console.log(datos)
        try {
            await WmSApi.post<string>('ImprimirEtiquetaRollo',datos);
        } catch (err) {
            console.log(err)
        }
        onPress()
    }

    const renderPrint = (item: PrinterInterface, index: number) => {
        return (
            <View style={{ width: '100%', borderWidth: 1, flex: 1, padding: 10, borderRadius: 15, marginBottom: 3 }}>
                <Pressable onPress={() => onSelectPrint(item)}>
                    <Text style={{ textAlign: 'center' }}>{item.iM_DESCRIPTION_PRINTER}</Text>
                </Pressable>
            </View>
        )

    }

    useEffect(() => {
        getImpresoras();
    }, [])
    return (
        <Modal visible={showImpresoras} transparent={true}>
            <View style={style.modal}>
                <View style={style.constainerModal}>
                    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between',marginBottom: 3 }}>
                        <View></View>
                        <View>
                            <Text style={style.text}>
                                Impresoras
                            </Text>
                        </View>
                        <View>
                            <TouchableOpacity onPress={onPress} style={{ padding: 5 }}>
                                <Icon name='times' size={15} color={black} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <FlatList
                        data={Impresoras}
                        keyExtractor={(item) => item.iM_DESCRIPTION_PRINTER}
                        renderItem={({ item, index }) => renderPrint(item, index)}
                        style={{ width: '90%' }}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </Modal>

    )
}

const style = StyleSheet.create({
    modal: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        backgroundColor: '#00000099',

    },
    constainerModal: {
        width: '90%',
        backgroundColor: grey,
        alignItems: 'center',
        borderRadius: 10,
        paddingVertical: 15,
        paddingHorizontal: 20,
        maxHeight: 400
    },
    text: {
        fontWeight: 'bold',
        marginTop: 10,
        color: navy
    },
})

export default PrintEtiquetaRollo
