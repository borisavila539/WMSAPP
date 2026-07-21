import React, { FC, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import Header from '../../../components/Header';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParams } from '../../../navigation/navigation';

import { PrinterInterface } from '../../../interfaces/PrintersInterface';
import { WMSDiseñoEtiquetaApi } from '../../../api/WMSDiseñoEtiquetaApi';
import { WmSApi } from '../../../api/WMSApi';

type props = StackScreenProps<
    RootStackParams,
    'DiseñoParaImprimirEtiquetasUbicacionScreen'
>;

interface RespuestaDiseño {
    datos: ElementoEtiqueta[];
    exito: boolean;
    mensaje: string;
}

interface ElementoEtiqueta {
    id: string;
    nombre: string;
    tipo: 'texto' | 'qr' | 'linea';
    texto?: string;
    x: number; // Posición real ZPL
    y: number; // Posición real ZPL
    fontSize?: number; // Tamaño fuente real ZPL
    bold?: boolean;
    ancho?: number; // Ancho real ZPL
    alto?: number; // Alto real ZPL (o escala QR)
}

// CONFIGURACIÓN DE LA ETIQUETA REAL (200 DPI) Y LIENZO PANTALLA
const ZPL_WIDTH = 850;
const ZPL_HEIGHT = 320;

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = (CANVAS_WIDTH * ZPL_HEIGHT) / ZPL_WIDTH; // Proporcional: 106.6 px

// FACTORES DE ESCALA (PANTALLA / ZPL)
const SCALE_X = CANVAS_WIDTH / ZPL_WIDTH; // 0.5333
const SCALE_Y = CANVAS_HEIGHT / ZPL_HEIGHT; // 0.5333
const TEXT_SCALE = 0.75;



// VALORES POR DEFECTO CON NORMAS ZPL REALES
const DISENO_DEFAULT: ElementoEtiqueta[] = [
    {
        id: 'rack',
        nombre: 'Texto Rack',
        tipo: 'texto',
        texto: 'Rack',
        x: 20,
        y: 155,
        fontSize: 75,
        bold: false,
    },
    {
        id: 'numero',
        nombre: 'Número Rack',
        tipo: 'texto',
        texto: '853',
        x: 190, // El texto principal comienza aquí
        y: 55,
        fontSize: 250,
        bold: true, // Simula el doble render del ZPL
    },
    {
        id: 'qr',
        nombre: 'Código QR',
        tipo: 'qr',
        x: 570,
        y: 30,
        alto: 10,
    },
];

export const DiseñoParaImprimirEtiquetasUbicacionScreen: FC<props> = () => {
    const [impresoras, setImpresoras] = useState<PrinterInterface[]>([]);
    const [showImpresoras, setShowImpresoras] = useState(false);
    const [impresoraSeleccionada, setImpresoraSeleccionada] = useState<PrinterInterface | null>(null);

    const [cantidadEtiquetas, setCantidadEtiquetas] = useState<number>(1);

    const [elementoSeleccionado, setElementoSeleccionado] = useState<ElementoEtiqueta | null>(null);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);

    const [elementos, setElementos] = useState<ElementoEtiqueta[]>(DISENO_DEFAULT);

    useEffect(() => {
        getImpresoras();
        getDiseñoGuardado();
    }, []);

    const getImpresoras = async () => {
        try {
            const resp = await WmSApi.get<PrinterInterface[]>('Impresoras');
            setImpresoras(resp.data);
        } catch (error) {
            console.log(error);
        }
    };

    const getDiseñoGuardado = async () => {
        try {
            const resp = await WMSDiseñoEtiquetaApi.get<RespuestaDiseño>('ObtenerDiseñoUbicacion');
            console.log(resp.data)
            if (
            resp.data.exito &&
            resp.data.datos &&
            resp.data.datos.length > 0
        ) {
            setElementos(resp.data.datos);
        }
        } catch (error) {
            console.log('Error al cargar diseño guardado:', error);
        }
    };

    const resetearDiseño = () => {
        Alert.alert(
            'Restablecer Diseño',
            '¿Estás seguro de que deseas volver al diseño predeterminado?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sí, Restablecer',
                    style: 'destructive',
                    onPress: () => {
                        setElementos(DISENO_DEFAULT);
                        setElementoSeleccionado(null);
                        Alert.alert('Éxito', 'Se ha cargado el diseño original.');
                    },
                },
            ]
        );
    };

    const actualizarElemento = (
        id: string,
        cambios: Partial<ElementoEtiqueta>,
    ) => {
        setElementos(prev =>
            prev.map(item => (item.id === id ? { ...item, ...cambios } : item)),
        );

        if (elementoSeleccionado?.id === id) {
            setElementoSeleccionado(prev => (prev ? { ...prev, ...cambios } : null));
        }
    };

    const handleNumInput = (
        campo: keyof ElementoEtiqueta,
        valorTexto: string,
        valorPorDefecto: number = 0,
    ) => {
        if (!elementoSeleccionado) return;
        if (valorTexto === '') {
            actualizarElemento(elementoSeleccionado.id, { [campo]: '' as any });
        } else {
            const num = parseInt(valorTexto, 10);
            actualizarElemento(elementoSeleccionado.id, {
                [campo]: isNaN(num) ? valorPorDefecto : num,
            });
        }
    };

    const handleBlur = (
        campo: keyof ElementoEtiqueta,
        valorPorDefecto: number = 0,
    ) => {
        if (!elementoSeleccionado) return;
        const valActual = elementoSeleccionado[campo];
        if (valActual === '' || valActual === undefined || isNaN(Number(valActual))) {
            actualizarElemento(elementoSeleccionado.id, { [campo]: valorPorDefecto });
        }
    };

    const moverElemento = (id: string, deltaX: number, deltaY: number) => {
        setElementos(prev =>
            prev.map(item => {
                if (item.id === id) {
                    const newX = Math.max(0, Math.min(ZPL_WIDTH - 20, item.x + deltaX));
                    const newY = Math.max(0, Math.min(ZPL_HEIGHT - 20, item.y + deltaY));
                    return { ...item, x: newX, y: newY };
                }
                return item;
            }),
        );

        if (elementoSeleccionado?.id === id) {
            setElementoSeleccionado(prev => {
                if (!prev) return null;
                const newX = Math.max(0, Math.min(ZPL_WIDTH - 20, prev.x + deltaX));
                const newY = Math.max(0, Math.min(ZPL_HEIGHT - 20, prev.y + deltaY));
                return { ...prev, x: newX, y: newY };
            });
        }
    };

    const abrirModalEdicion = (item: ElementoEtiqueta) => {
        setElementoSeleccionado(item);
        setShowEditModal(true);
    };

    const generarZPL = () => {
        // Definimos Ancho (800) y Alto (400) para 4x2 pulgadas
        let zpl = '^XA\n^PW800\n^LL400\n';

        elementos.forEach(item => {
            switch (item.tipo) {
                case 'texto':
                    const fontH = item.fontSize || 100;
                    const fontW = item.fontSize || 100;
                    if (item.bold) {
                        zpl += `\n^FO${(Number(item.x) || 0) + 1},${Number(item.y) || 0}\n^A0N,${fontH},${fontW}\n^FD${item.texto || ''}\n^FS`;
                    }
                    zpl += `\n^FO${Number(item.x) || 0},${Number(item.y) || 0}\n^A0N,${fontH},${fontW}\n^FD${item.texto || ''}\n^FS\n`;
                    break;

                case 'qr':
                    const numTexto = elementos.find(e => e.id === 'numero')?.texto;
                    const rackTexto = elementos.find(e => e.id === 'rack')?.texto;
                    const qrVal = numTexto || rackTexto || '853';
                    const escalaQR = item.alto || 10;
                    zpl += `\n^FO${Number(item.x) || 0},${Number(item.y) || 0}\n^BQN,2,${escalaQR}\n^FDLA,${qrVal}\n^FS\n`;
                    break;
            }
        });

        zpl += `\n^PQ${cantidadEtiquetas}\n^XZ`;
        return zpl;
    };

    const imprimirPrueba = async () => {
        if (!impresoraSeleccionada) {
            Alert.alert('Error', 'Por favor seleccione una impresora primero');
            return;
        }

        if (cantidadEtiquetas < 1) {
            Alert.alert('Atención', 'La cantidad de etiquetas debe ser mayor a 0');
            return;
        }

        try {
            const zpl = generarZPL();
            await WMSDiseñoEtiquetaApi.post('ImprimirPrueba', {
                impresora: impresoraSeleccionada.iM_IPPRINTER,
                zpl,
                cantidad: cantidadEtiquetas,
            });
            Alert.alert('Éxito', `Enviada(s) ${cantidadEtiquetas} etiqueta(s) a impresión`);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'No se pudo enviar la orden de impresión');
        }
    };

    const guardarDiseño = async () => {
        try {
            console.log("llego al metodo de guardado")
            await WMSDiseñoEtiquetaApi.post('GuardarDiseñoUbicacion', elementos);
            Alert.alert('Éxito', 'Diseño guardado correctamente');
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'No se pudo guardar el diseño');
        }
    };
    const getPreviewFontSize = (zplFont: number) => {
    if (zplFont >= 200) {
        return zplFont * SCALE_Y * 0.75;
    }

    if (zplFont >= 100) {
        return zplFont * SCALE_Y * 0.85;
    }

    return zplFont * SCALE_Y;
};

    // RENDERIZADO CON CONVERSIÓN DE COORDENADAS ZPL -> PANTALLA
const RenderElemento = ({ item }: { item: ElementoEtiqueta }) => {
    let posXScreen =(Number(item.x) || 0) * SCALE_X +(item.fontSize && item.fontSize >= 200 ? 12 : 0);
    let posYScreen = (Number(item.y) || 0) * SCALE_Y + (item.fontSize && item.fontSize >= 200 ? 12 : 0);
    if (item.tipo === 'qr') {
        posYScreen -= 5;
    }
    const qrScale = Number(item.alto) || 8;
    const qrSize = qrScale * 25 * SCALE_X;
    const esSeleccionado = elementoSeleccionado?.id === item.id;

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => abrirModalEdicion(item)}
            style={[
                styles.elementoCanvas,
                {
                    left: posXScreen,
                    top: posYScreen,
                },
                esSeleccionado && styles.elementoSeleccionado,
            ]}
        >
            {item.tipo === 'texto' && (
                <Text
                    style={{
                        // Escalado directo sin reducción artificial
                        fontSize: getPreviewFontSize( Number(item.fontSize) || 75),//Number(item.fontSize) || 75) * SCALE_Y * TEXT_SCALE,
                        // Ajuste para que la caja del texto en RN se pegue al renderizado de Zebra
                        lineHeight: getPreviewFontSize( Number(item.fontSize) || 75),  //(Number(item.fontSize) || 75) * SCALE_Y *  TEXT_SCALE,
                        fontWeight: item.bold ? 'bold' : 'normal',
                        color: '#000',
                        includeFontPadding: false,
                    }}
                >
                    {item.texto}
                </Text>
            )}

            {item.tipo === 'qr' && (
                <View
                    style={[
                        styles.qrCanvas,
                        {
                            // 29 módulos del QR * Factor ZPL (8) * Escala Pantalla (0.4)
                            // width: 30 * (Number(item.alto) || 8) * SCALE_X,
                            // height: 30 * (Number(item.alto) || 8) * SCALE_Y,
                            width: qrSize,
                            height: qrSize,
                        },
                    ]}
                >
                    <Text style={styles.qrText}>QR</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

    return (
        <View style={styles.container}>
            <Header texto1="" texto2="Diseño Etiqueta" texto3="Ubicación" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* VISTA PREVIA */}
                <View style={styles.card}>
                    <View style={styles.headerTitleRow}>
                        <Text style={styles.cardTitle}>📐 Vista Previa Escalada (800x400 px)</Text>
                        <TouchableOpacity onPress={resetearDiseño} style={styles.btnReset}>
                            <Text style={styles.btnResetText}>🔄 Reset</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.cardSubtitle}>
                        Toca un elemento para editar sus coordenadas ZPL reales.
                    </Text>

                    <View style={styles.canvasContainer}>
                        {elementos.map(item => (
                            <RenderElemento key={item.id} item={item} />
                        ))}
                    </View>

                    {/* TABS DE SELECCIÓN DE ELEMENTOS */}
                    <Text style={styles.tabsHeaderTitle}>Elementos del Diseño:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
                        {elementos.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.tabItem,
                                    elementoSeleccionado?.id === item.id && styles.tabItemActive,
                                ]}
                                onPress={() => abrirModalEdicion(item)}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        elementoSeleccionado?.id === item.id && styles.tabTextActive,
                                    ]}
                                >
                                    {item.nombre}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* CONFIGURACIÓN Y CANTIDAD */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🖨️ Opciones de Impresión</Text>

                    <Text style={styles.label}>Impresora Destino</Text>
                    <TouchableOpacity
                        onPress={() => setShowImpresoras(true)}
                        style={styles.btnSelectPrinter}
                    >
                        <Text style={styles.btnSelectPrinterText}>
                            {impresoraSeleccionada
                                ? `🖨️ ${impresoraSeleccionada.iM_DESCRIPTION_PRINTER}`
                                : 'Seleccionar Impresora'}
                        </Text>
                    </TouchableOpacity>

                    {/* INPUT PARA CANTIDAD DE ETIQUETAS */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Cantidad de Etiquetas a Imprimir</Text>
                        <TextInput
                            keyboardType="numeric"
                            value={String(cantidadEtiquetas)}
                            onChangeText={val => {
                                const num = parseInt(val, 10);
                                setCantidadEtiquetas(isNaN(num) ? 0 : num);
                            }}
                            style={styles.input}
                            placeholder="Ej. 1"
                        />
                    </View>

                    {/* BOTONES DE ACCIÓN */}
                    <View style={styles.rowFields}>
                        <TouchableOpacity
                            onPress={imprimirPrueba}
                            style={[styles.btnPrimary, { backgroundColor: '#2E7D32', flex: 1, marginRight: 6 }]}
                        >
                            <Text style={styles.btnText}>Imprimir ({cantidadEtiquetas})</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={guardarDiseño}
                            style={[styles.btnPrimary, { backgroundColor: '#E65100', flex: 1, marginLeft: 6 }]}
                        >
                            <Text style={styles.btnText}>Guardar Diseño</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* POPUP / MODAL DE EDICIÓN DE ELEMENTO */}
            <Modal
                visible={showEditModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlayCenter}>
                    <View style={styles.popupContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                ✏️ {elementoSeleccionado?.nombre}
                            </Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Text style={styles.closeText}>✕ Cerrar</Text>
                            </TouchableOpacity>
                        </View>

                        {elementoSeleccionado && (
                            <View style={styles.popupBody}>
                                {elementoSeleccionado.tipo === 'texto' && (
                                    <View style={styles.fieldGroup}>
                                        <Text style={styles.label}>Texto del elemento</Text>
                                        <TextInput
                                            value={elementoSeleccionado.texto || ''}
                                            onChangeText={text =>
                                                actualizarElemento(elementoSeleccionado.id, {
                                                    texto: text,
                                                })
                                            }
                                            style={styles.input}
                                            placeholder="Ingrese texto..."
                                        />
                                    </View>
                                )}

                                {/* CONTROLES DE DIRECCIÓN (DPAD DE 10 DOTS ZPL) */}
                                <Text style={styles.label}>Ajuste Fino de Posición (Dots ZPL)</Text>
                                <View style={styles.dpadContainer}>
                                    <TouchableOpacity
                                        style={styles.dpadBtn}
                                        onPress={() => moverElemento(elementoSeleccionado.id, 0, -10)}
                                    >
                                        <Text style={styles.dpadText}>▲</Text>
                                    </TouchableOpacity>
                                    <View style={styles.dpadRowMiddle}>
                                        <TouchableOpacity
                                            style={styles.dpadBtn}
                                            onPress={() => moverElemento(elementoSeleccionado.id, -10, 0)}
                                        >
                                            <Text style={styles.dpadText}>◀</Text>
                                        </TouchableOpacity>
                                        <View style={styles.dpadCenterSpace} />
                                        <TouchableOpacity
                                            style={styles.dpadBtn}
                                            onPress={() => moverElemento(elementoSeleccionado.id, 10, 0)}
                                        >
                                            <Text style={styles.dpadText}>▶</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.dpadBtn}
                                        onPress={() => moverElemento(elementoSeleccionado.id, 0, 10)}
                                    >
                                        <Text style={styles.dpadText}>▼</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* COORDENADAS ZPL REALES */}
                                <View style={styles.rowFields}>
                                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                                        <Text style={styles.label}>Posición X ZPL (^FO)</Text>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={String(elementoSeleccionado.x ?? '')}
                                            onChangeText={v => handleNumInput('x', v, 0)}
                                            onBlur={() => handleBlur('x', 0)}
                                            style={styles.input}
                                        />
                                    </View>

                                    <View style={[styles.fieldGroup, { flex: 1, marginLeft: 10 }]}>
                                        <Text style={styles.label}>Posición Y ZPL (^FO)</Text>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={String(elementoSeleccionado.y ?? '')}
                                            onChangeText={v => handleNumInput('y', v, 0)}
                                            onBlur={() => handleBlur('y', 0)}
                                            style={styles.input}
                                        />
                                    </View>
                                </View>

                                {/* PROPIEDADES ESPECÍFICAS SEGÚN TIPO */}
                                {elementoSeleccionado.tipo === 'texto' && (
                                    <View style={styles.rowFields}>
                                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                                            <Text style={styles.label}>Fuente ZPL (^A0N)</Text>
                                            <TextInput
                                                keyboardType="numeric"
                                                value={String(elementoSeleccionado.fontSize ?? '')}
                                                onChangeText={v => handleNumInput('fontSize', v, 45)}
                                                onBlur={() => handleBlur('fontSize', 45)}
                                                style={styles.input}
                                            />
                                        </View>

                                        <View style={[styles.fieldGroup, { flex: 1, marginLeft: 10, justifyContent: 'flex-end' }]}>
                                            <TouchableOpacity
                                                onPress={() =>
                                                    actualizarElemento(elementoSeleccionado.id, {
                                                        bold: !elementoSeleccionado.bold,
                                                    })
                                                }
                                                style={[
                                                    styles.btnSecondary,
                                                    elementoSeleccionado.bold && styles.btnActive,
                                                ]}
                                            >
                                                <Text style={[
                                                    styles.btnSecondaryText,
                                                    elementoSeleccionado.bold && { color: '#FFF' }
                                                ]}>
                                                    {elementoSeleccionado.bold ? '✓ Negrita' : 'Negrita'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}

                                {elementoSeleccionado.tipo === 'linea' && (
                                    <View style={styles.rowFields}>
                                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                                            <Text style={styles.label}>Ancho ZPL (^GB)</Text>
                                            <TextInput
                                                keyboardType="numeric"
                                                value={String(elementoSeleccionado.ancho ?? '')}
                                                onChangeText={v => handleNumInput('ancho', v, 300)}
                                                onBlur={() => handleBlur('ancho', 300)}
                                                style={styles.input}
                                            />
                                        </View>

                                        <View style={[styles.fieldGroup, { flex: 1, marginLeft: 10 }]}>
                                            <Text style={styles.label}>Grosor ZPL (^GB)</Text>
                                            <TextInput
                                                keyboardType="numeric"
                                                value={String(elementoSeleccionado.alto ?? '')}
                                                onChangeText={v => handleNumInput('alto', v, 3)}
                                                onBlur={() => handleBlur('alto', 3)}
                                                style={styles.input}
                                            />
                                        </View>
                                    </View>
                                )}

                                {elementoSeleccionado.tipo === 'qr' && (
                                    <View style={styles.fieldGroup}>
                                        <Text style={styles.label}>Escala QR ZPL (^BQN,2,X)</Text>
                                        <TextInput
                                            keyboardType="numeric"
                                            value={String(elementoSeleccionado.alto ?? '')}
                                            onChangeText={v => handleNumInput('alto', v, 6)}
                                            onBlur={() => handleBlur('alto', 6)}
                                            style={styles.input}
                                            placeholder="Por defecto: 6"
                                        />
                                    </View>
                                )}

                                <TouchableOpacity
                                    onPress={() => setShowEditModal(false)}
                                    style={[styles.btnPrimary, { backgroundColor: '#1565C0', marginTop: 15 }]}
                                >
                                    <Text style={styles.btnText}>Aplicar y Cerrar</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* MODAL IMPRESORAS */}
            <Modal
                visible={showImpresoras}
                transparent
                animationType="slide"
                onRequestClose={() => setShowImpresoras(false)}
            >
                <View style={styles.modalOverlayBottom}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Impresora</Text>
                            <TouchableOpacity onPress={() => setShowImpresoras(false)}>
                                <Text style={styles.closeText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={impresoras}
                            keyExtractor={(item, index) => `${item.iM_IPPRINTER}-${index}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        setImpresoraSeleccionada(item);
                                        setShowImpresoras(false);
                                    }}
                                    style={styles.printerItem}
                                >
                                    <Text style={styles.printerName}>
                                        {item.iM_DESCRIPTION_PRINTER}
                                    </Text>
                                    <Text style={styles.printerIp}>{item.iM_IPPRINTER}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6F8',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    card: {
        marginHorizontal: 12,
        marginTop: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#263238',
    },
    btnReset: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 4,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    btnResetText: {
        color: '#C62828',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#78909C',
        marginBottom: 10,
        marginTop: 2,
    },
    canvasContainer: {
        height: CANVAS_HEIGHT,
        width: CANVAS_WIDTH,
        alignSelf: 'center',
        borderWidth: 1.5,
        borderColor: '#B0BEC5',
        borderStyle: 'dashed',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        position: 'relative',
    },
    elementoCanvas: {
        position: 'absolute',
       padding: 0, // Importante: sin padding interno
    margin: 0,
    },
    elementoSeleccionado: {
        borderColor: '#1565C0',
        borderWidth: 1.5,
        borderStyle: 'solid',
        backgroundColor: 'rgba(21, 101, 192, 0.1)',
    },
    // lineaCanvas: {
    //     backgroundColor: '#000',
    // },
    qrCanvas: {
        borderWidth: 1,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    qrText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    tabsHeaderTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#546E7A',
        marginTop: 12,
        marginBottom: 6,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingBottom: 4,
    },
    tabItem: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#ECEFF1',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#CFD8DC',
    },
    tabItemActive: {
        backgroundColor: '#1565C0',
        borderColor: '#1565C0',
    },
    tabText: {
        fontSize: 12,
        color: '#37474F',
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    fieldGroup: {
        marginBottom: 10,
    },
    rowFields: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        color: '#455A64',
        marginBottom: 4,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#CFD8DC',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 14,
        backgroundColor: '#FAFAFA',
        color: '#263238',
    },
    btnSelectPrinter: {
        borderWidth: 1,
        borderColor: '#1565C0',
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    btnSelectPrinterText: {
        color: '#1565C0',
        fontWeight: 'bold',
        fontSize: 14,
    },
    btnPrimary: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    dpadContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    dpadRowMiddle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 2,
    },
    dpadBtn: {
        backgroundColor: '#ECEFF1',
        borderWidth: 1,
        borderColor: '#B0BEC5',
        borderRadius: 6,
        width: 40,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dpadCenterSpace: {
        width: 30,
    },
    dpadText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#37474F',
    },
    btnSecondary: {
        backgroundColor: '#ECEFF1',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CFD8DC',
    },
    btnActive: {
        backgroundColor: '#1565C0',
        borderColor: '#1565C0',
    },
    btnSecondaryText: {
        color: '#37474F',
        fontWeight: '600',
        fontSize: 13,
    },
    modalOverlayCenter: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    popupContainer: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        elevation: 5,
    },
    modalOverlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ECEFF1',
        paddingBottom: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#263238',
    },
    popupBody: {
        marginTop: 4,
    },
    closeText: {
        color: '#D32F2F',
        fontWeight: 'bold',
        fontSize: 13,
    },
    printerItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ECEFF1',
    },
    printerName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#37474F',
    },
    printerIp: {
        fontSize: 12,
        color: '#78909C',
    },
});