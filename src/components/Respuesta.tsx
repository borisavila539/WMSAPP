import React from 'react';
import {
    Modal,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

export interface ResultadoModalItem {
    datos?: string | number;
    exito: boolean;
    mensaje: string;
}

interface Props {
    visible: boolean;
    titulo?: string;
    resultados: ResultadoModalItem[];
    onClose: () => void;
}

const ResultadoModal = ({
    visible,
    titulo = 'Resultado',
    resultados,
    onClose,
}: Props) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>{titulo}</Text>

                    <FlatList
                        data={resultados}
                        keyExtractor={(_, index) => index.toString()}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View
                                style={[
                                    styles.item,
                                    {
                                        borderLeftColor: item.exito
                                            ? '#2ECC71'
                                            : '#E74C3C',
                                        backgroundColor: item.exito
                                            ? '#E8F8F5'
                                            : '#FDEDEC',
                                    },
                                ]}
                            >
                                <Text style={styles.itemTitle}>
                                    {item.exito ? '✅ Éxito' : '❌ Error'}
                                </Text>

                                {item.datos !== undefined &&
                                    item.datos !== null &&
                                    item.datos !== '' && (
                                        <Text style={styles.dato}>
                                            {item.datos}
                                        </Text>
                                    )}

                                <Text style={styles.message}>
                                    {item.mensaje}
                                </Text>
                            </View>
                        )}
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={onClose}
                    >
                        <Text style={styles.buttonText}>
                            Cerrar
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default ResultadoModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    item: {
        marginBottom: 10,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 5,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    dato: {
        fontSize: 14,
        fontWeight: '600',
        color: '#444',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        color: '#333',
    },
    button: {
        marginTop: 10,
        backgroundColor: '#222',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
});