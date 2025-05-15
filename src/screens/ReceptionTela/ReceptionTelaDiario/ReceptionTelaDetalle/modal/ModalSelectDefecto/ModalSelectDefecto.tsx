import { TelaPickingDefecto, TelaPickingIsScanning, TelaPickingMerge } from "../../../ReceptionTela.types";
import { FC, useEffect, useState, } from "react";
import Icon from 'react-native-vector-icons/FontAwesome5';
import { black, blue, grey } from "../../../../../../constants/Colors";
import { FlatList, Modal, Pressable, View, Text, TouchableHighlight } from "react-native";
import { ModalSelectDefectoStyle } from "./ModalSelectDefecto.style";
import { ReceptionTelaService } from "../../../ReceptionTelaService";

interface ModalSelectDefecto {
    isOpenModal: boolean;
    onClose: (value: TelaPickingDefecto | null) => void;
    listDefecto: TelaPickingDefecto[];
    selectedRollo: TelaPickingMerge | null;
}

export const ModalSelectDefecto: FC<ModalSelectDefecto> = ({ isOpenModal, onClose, listDefecto, selectedRollo }) => {
    
    const receptionTelaService = new ReceptionTelaService(); 
    
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
            <View style={ModalSelectDefectoStyle.centeredView}>
                <View style={ModalSelectDefectoStyle.modalView}>
                    <View style={ModalSelectDefectoStyle.modalHeader} >
                        <Text style={{ fontSize: 16, fontWeight: '700' }} >{selectedRollo?.inventSerialId}</Text>
                        <Pressable
                            onPress={() => { onClose(null) }}>
                            <Icon name='times' size={18} color={black} />
                        </Pressable>
                    </View>

                    <FlatList

                        data={listDefecto}
                        renderItem={(item) =>
                            <TouchableHighlight
                                underlayColor={'#E0E0E0'}
                                onPress={() => {
                                    setModalVisible(false);
                                    onClose(item.item);
                                }}
                                style={{ flex: 1, margin: 4, borderRadius: 6, borderWidth: 1 }}

                            >
                                
                                <Text style={
                                    {   fontSize: 16, padding: 6, 
                                        backgroundColor: selectedRollo?.telaPickingDefectoId === item.item.telaPickingDefectoId ? blue : 'transparent', 
                                        color: selectedRollo?.telaPickingDefectoId === item.item.telaPickingDefectoId ? '#fff' : '#000' 
                                    }} >{item.item.descriptionDefecto}</Text>
                            </TouchableHighlight>
                        }
                    />
                </View>
            </View>
        </Modal>
    )
}