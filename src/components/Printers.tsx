import React, { useContext, useEffect, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { black, grey, navy } from '../constants/Colors'
import { PrinterInterface, PrintersInterface } from '../interfaces/PrintersInterface'
import { WmSApi } from '../api/WMSApi';
import { WMSContext } from '../context/WMSContext';
import Icon from 'react-native-vector-icons/FontAwesome5'

function Printers({ ShowImpresoras, IMBoxCode, onPress }: PrintersInterface) {
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
        try {
            await WmSApi.get<string>(`ImprimirEtiquetaMovimiento/${WMSState.diario}/${IMBoxCode}/${item.iM_IPPRINTER}`)
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
        <Modal visible={ShowImpresoras} transparent={true}>
            <View style={style.modal}>
                <View style={style.constainerModal}>
                    <TouchableOpacity onPress={onPress} style={{alignItems: 'flex-end'}}>
                        <Icon name='times' size={15} color={black} />
                    </TouchableOpacity>
                    <Text style={style.text}>
                        Impresoras
                    </Text>
                    <FlatList
                        data={Impresoras}
                        keyExtractor={(item) => item.iM_DESCRIPTION_PRINTER}
                        renderItem={({ item, index }) => renderPrint(item, index)}
                        style={{ width: '90%' }}
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
        maxHeight: 300
    },
    text: {
        fontWeight: 'bold',
        marginTop: 10,
        color: navy
    },
})

export default Printers