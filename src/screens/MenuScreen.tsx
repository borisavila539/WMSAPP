import React, { FC, useEffect, useState } from 'react'
import { FlatList, Image, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { ScreensInterface } from '../interfaces/ScreeensInterface'
import { RootStackParams } from '../navigation/navigation'
import { StackScreenProps } from '@react-navigation/stack'
import { grey, navy } from '../constants/Colors'
import Header from '../components/Header'
import { WmSApi } from '../api/WMSApi'
import { WMSContext } from '../context/WMSContext'

interface PermisoUsuario {
    id?: number;
    numeroColaborador?: string;
    nombreCompleto?: string;
    pantalla?: string;
    permisoAdmin?: boolean | number;
    permisoLectura?: boolean | number;
}

// Catálogo general fuera de la función para evitar instanciarlo en cada render
const TODAS_LAS_PANTALLAS: ScreensInterface[] = [
    { Name: 'Diarios', Screen: 'DiariosModuleScreen', image: require('../assets/Diarios.png') },
    { Name: 'Empaque y Despacho', Screen: 'EmpaqueYDespachoScreen', image: require('../assets/EmpaqueYDespacho.png') },
    { Name: 'Recepción y Ubicación', Screen: 'MenuRecepcionYUbiacionScreen', image: require('../assets/AuditoriaImagen.png') },
    { Name: 'Tela', Screen: 'TelaModuleScreen', image: require('../assets/DespachoTela.jpg') },
    { Name: 'Devoluciones', Screen: 'MenuPrincipalDevolucion', image: require('../assets/Devolucion.png') },
    { Name: 'Guias de Transporte', Screen: 'GuiasTrasportesScreen', image: require('../assets/GuiaTransporte.png') },
    { Name: 'Gestion Serigrafia', Screen: 'MenuGestionSerigrafiaScreen', image: require('../assets/SerigrafiaPng.png') },
    { Name: 'Diseño e Impresión de Etiquetas', Screen: 'DiseñoEtiquetasEImpresionModule', image: require('../assets/ModuloDiseñoEtiqueta.png') },
];

type props = StackScreenProps<RootStackParams, "MenuScreen">

export const MenuScreen: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<ScreensInterface[]>([])
    const { WMSState } = React.useContext(WMSContext);
    const [cargando, setCargando] = useState<boolean>(true);
    const [permisosUsuario, setPermisosUsuario] = useState<PermisoUsuario[]>([]);

    const getPermisosUsuario = async () => {
        setCargando(true);
        try {
            const resp = await WmSApi.get(`GetPermisoUsuario/${WMSState.usuario}`);

            // 1. Convertimos la respuesta en Arreglo sin importar si vino [] o {}
            let rawData = resp.data;
            let arrayPermisos: PermisoUsuario[] = [];

            if (rawData) {
                arrayPermisos = Array.isArray(rawData) ? rawData : [rawData];
            }

            // Guardamos en el estado para que quede accesible globalmente en el componente
            setPermisosUsuario(arrayPermisos);

            // 2. Usamos directamente la variable local `arrayPermisos`
            if (arrayPermisos.length > 0) {
                // Extraemos los nombres de pantalla asegurando coincidencia
                const nombresPantallasPermitidas = arrayPermisos
                    .map(p => p.pantalla)
                    .filter((p): p is string => Boolean(p));


                // Filtramos
                const pantallasFiltradas = TODAS_LAS_PANTALLAS.filter(item =>
                    nombresPantallasPermitidas.includes(item.Screen)
                );

                setData(pantallasFiltradas.length > 0 ? pantallasFiltradas : TODAS_LAS_PANTALLAS);
            } else {
                setData(TODAS_LAS_PANTALLAS);
            }
        } catch (err) {
            console.log('Error al obtener permisos de usuario:', err);
            setData(TODAS_LAS_PANTALLAS);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        getPermisosUsuario();
    }, []);

    const renderItem = (item: ScreensInterface) => {
        return (
            <View style={{ width: '50%', alignItems: 'center' }}>
                <View style={{ width: '95%', borderWidth: 1, alignItems: 'center', borderRadius: 15, paddingVertical: 5, marginTop: 5 }}>
                    <TouchableOpacity onPress={() => navigation.navigate(item.Screen)} style={{ alignItems: 'center' }}>
                        <Image
                            source={item.image}
                            style={{ width: item.Name === 'Diseño e Impresión de Etiquetas' ? 190 : 100, height: 120, resizeMode: 'contain' }}
                        />
                        <Text style={{ color: navy, textAlign: 'center' }}>{item.Name}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey }}>
            <Header texto1='' texto2='Menu' texto3='' />

            {cargando ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={navy} />
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.Screen.toString()}
                    renderItem={({ item }) => renderItem(item)}
                    showsVerticalScrollIndicator={false}
                    numColumns={2}
                />
            )}
        </View>
    )
}