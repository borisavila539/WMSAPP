import { Modal, View, Text, TouchableHighlight } from "react-native";
import { FC, useEffect, useState } from "react";
import { ModalRuleCountStyle } from "./ModalRuleCount.style";

interface ModalRuleCountProps {
    isOpenModal: boolean;
    onClose: () => void;
    location: string;
    limiteAlcanzado: number;
}

export const ModalRuleCount: FC<ModalRuleCountProps> = ({ isOpenModal, onClose, location, limiteAlcanzado }) => {
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
            <View style={ModalRuleCountStyle.centeredView}>
                <View style={ModalRuleCountStyle.modalView}>
                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignContent: 'center' }} >
                        <Text style={{ textAlign: 'center', fontSize: 20 }}>
                            Límite para <Text style={{ fontWeight: 'bold' }}>{location}</Text> de <Text style={{ fontWeight: 'bold' }}>{limiteAlcanzado}</Text> alcanzado.
                        </Text>


                        <TouchableHighlight
                            underlayColor={'#E0E0E0'}
                            onPress={() => {
                                setModalVisible(false);
                                onClose();
                            }}
                            style={{ margin: 4, borderRadius: 10, top: 22, padding: 5, borderWidth: 1 }}

                        >
                            <Text style={{ width: '100%', textAlign: 'center', borderRadius: 10, marginBottom: 5, padding: 5 }}>


                                Cambiar de ubicación.
                            </Text>
                        </TouchableHighlight>
                    </View>
                </View>
            </View>
        </Modal>
    )
}