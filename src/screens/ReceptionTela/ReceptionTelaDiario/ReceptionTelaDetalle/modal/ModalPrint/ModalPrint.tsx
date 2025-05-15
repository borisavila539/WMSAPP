import { Impresoras, TelaPickingMerge } from "../../../ReceptionTela.types";
import { FC, useEffect, useState, } from "react";
import Icon from 'react-native-vector-icons/FontAwesome5';
import { black } from "../../../../../../constants/Colors";
import { Modal, Pressable, View, Text, FlatList, TouchableHighlight } from "react-native";
import { ModalPrintStyle } from "./ModalPrint.style";

interface ModalPrint {
    isOpenModal: boolean;
    onClose: (value: string | null, selectedRollo:TelaPickingMerge | null) => void;
    listaImpresoras: Impresoras[];
    journalId: string;
    selectedRollo: TelaPickingMerge | null;
}

export const ModalPrint: FC<ModalPrint> = ({ isOpenModal, onClose, listaImpresoras, journalId, selectedRollo }) => {

    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        setModalVisible(isOpenModal);
    }, [isOpenModal]);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
                setModalVisible(false);
            }}>
            <View style={ModalPrintStyle.centeredView}>
                <View style={ModalPrintStyle.modalView}>
                    <View style={ModalPrintStyle.modalHeader} >
                        <Text style={{ fontSize: 16, fontWeight: '700' }} >Imprimir { selectedRollo? selectedRollo.inventSerialId : journalId}</Text>
                        <Pressable
                            onPress={() => { onClose(null, null) }}>
                            <Icon name='times' size={18} color={black} />
                        </Pressable>
                    </View>

                    <FlatList

                        data={listaImpresoras}
                        renderItem={(item) => <TouchableHighlight
                            underlayColor={'#E0E0E0'}
                            onPress={() => {
                                setModalVisible(false);
                                onClose(item.item.iM_IPPRINTER, selectedRollo);
                            }}
                            style={{ flex: 1, margin: 4, borderRadius: 6, borderWidth: 1 }}
                        >
                            <Text
                                style={{fontSize: 16, padding: 6}}
                            >{item.item.iM_DESCRIPTION_PRINTER}</Text>
                        </TouchableHighlight>}
                    />


                </View>
            </View>
        </Modal>
    )
}