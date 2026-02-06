import { Modal, View, Text, ScrollView, Button, StyleSheet } from "react-native";
import { useState } from "react";

export default function CustomAlert() {
    const [showModal, setShowModal] = useState(false);
    const [modalText, setModalText] = useState("");

    return (
        <Modal visible={showModal} transparent={true} animationType="slide">
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <ScrollView style={{ maxHeight: 400 }}>
                        <Text style={styles.modalText}>{modalText}</Text>
                    </ScrollView>

                    <Button title="Cerrar" onPress={() => setShowModal(false)} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '80%',
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
    },
});
