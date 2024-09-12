import React, { useContext, useEffect, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native'
import { black, grey, navy } from '../constants/Colors'
import { PrinterInterface, PrintersInterface } from '../interfaces/PrintersInterface'
import { WmSApi } from '../api/WMSApi';
import { WMSContext } from '../context/WMSContext';
import Icon from 'react-native-vector-icons/FontAwesome5'

const Printers = ({ ShowImpresoras, IMBoxCode, onPress, peticion, Tipo }: PrintersInterface) => {
    const [Impresoras, setImpresoras] = useState<PrinterInterface[]>([]);
    const { WMSState } = useContext(WMSContext)

    const getImpresoras = async () => {
        try {
            const response = await WmSApi.get<PrinterInterface[]>('Impresoras');
            setImpresoras(response.data);
        } catch (err) {
            console.log(err)
        }
        console.log('Lista')
    }

    const onSelectPrint = async (item: PrinterInterface) => {
        console.log('Selected printer:', item.iM_IPPRINTER);
    
        try {
            if (Tipo) {
                const response = await WmSApi.get<string>(`ImprimirEtiquetaMovimiento/${WMSState.diario}/${IMBoxCode}/${item.iM_IPPRINTER}`);
                console.log('Response for Tipo:', response.data);
            } else {
                const response = await WmSApi.get<string>(`${peticion}/${item.iM_IPPRINTER}`);
                console.log('Response for peticion:', response.data);
            }
        } catch (err) {
            console.log('Error:', err);
        }
        onPress();
    }
    

    const renderPrint = (item: PrinterInterface, index: number) => {
        return (
            <View style={styles.printItem}>
                <TouchableOpacity onPress={() => onSelectPrint(item)} activeOpacity={0.5} >
                    <Text style={styles.printText}>{item.iM_DESCRIPTION_PRINTER}</Text>
                </TouchableOpacity>
            </View>
        )
    }

    useEffect(() => {
        getImpresoras()
        console.log('init')
    }, [])
    
    return (
        <Modal visible={ShowImpresoras} transparent={true}>
            <View style={styles.modal}>
                <View style={styles.constainerModal}>
                    <View style={styles.header}>
                        <View></View>
                        <Text style={styles.text}>Impresoras</Text>
                        <TouchableOpacity onPress={onPress} style={styles.closeButton}>
                            <Icon name='times' size={15} color={black} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={Impresoras}
                        keyExtractor={(item) => item.iM_DESCRIPTION_PRINTER}
                        renderItem={({ item, index }) => renderPrint(item, index)}
                        style={styles.flatList}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
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
        maxHeight: 400,
    },
    text: {
        fontWeight: 'bold',
        marginTop: 10,
        color: navy,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    closeButton: {
        padding: 5,
    },
    flatList: {
        width: '90%',
    },
    printItem: {
        width: '100%',
        borderWidth: 1,
        flex: 1,
        padding: 10,
        borderRadius: 15,
        marginBottom: 3,
    },
    printText: {
        textAlign: 'center',
    },
})

export default Printers;
