import React, { FC, useEffect, useState, useContext } from 'react'
import { FlatList, Image, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { ScreensInterface } from '../../interfaces/ScreeensInterface'
import { RootStackParams } from '../../navigation/navigation'
import { StackScreenProps } from '@react-navigation/stack'
import { grey, navy } from '../../constants/Colors'
import Header from '../../components/Header'
import { WmSApi } from '../../api/WMSApi'
import { WMSContext } from '../../context/WMSContext'

interface PermisoUsuario {
    id?: number;
    numeroColaborador?: string;
    nombreCompleto?: string;
    pantalla?: string;
    permisoAdmin?: boolean | number;
    permisoLectura?: boolean | number;
}

// Catálogo constante fuera del componente
const TODAS_LAS_PANTALLAS_TELA: ScreensInterface[] = [
    { Name: 'Despacho Tela', Screen: 'Seleccionartraslados', image: require('../../assets/DespachoTela.jpg') },
    { Name: 'Busqueda Rollos', Screen: 'BusquedaRolloAXScreen', image: require('../../assets/DespachoTela.jpg') },
    { Name: 'Impresion Etiquetas Rollos', Screen: 'ImpresionEtiquetasRollosScreen', image: require('../../assets/DespachoTela.jpg') },
    { Name: 'Ciclico Tela', Screen: 'DiariosinventarioCiclicoTelaScreen', image: require('../../assets/DespachoTela.jpg') },
    { Name: 'Recepcion de tela', Screen: 'ReceptionTelaMenu', image: require('../../assets/PickingTela.png') },
    { Name: 'Cambio Ubicacion Tela', Screen: 'CambioUbicacionTelaScreen', image: require('../../assets/CambioUbicacion.png') },
    { Name: 'Consultar Ubicacion Rollos', Screen: 'ConsultarUbicacionRollosScreen', image: require('../../assets/ConsultaRollosPorUbicación.png') },
    { Name: 'Diarios Abierto de Tranferencia de Rollos', Screen: 'ConsultaDiairosAbiertosScreen', image: require('../../assets/ConsultaDiariosPendiente.png') },
];

type props = StackScreenProps<RootStackParams, "TelaModuleScreen">

export const TelaModuleScreen: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<ScreensInterface[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [permisosUsuario, setPermisosUsuario] = useState<PermisoUsuario[]>([]);
    const { WMSState } = useContext(WMSContext);

    const getPermisosUsuario = async () => {
        setCargando(true);
        try {
            const resp = await WmSApi.get(`GetPermisoUsuario/${WMSState.usuario}`);
            console.log('Respuesta de permisos de usuario:', resp.data);
            // Normalización para soportar un objeto {} o un array []
            let rawData = resp.data;
            let arrayPermisos: PermisoUsuario[] = [];

            if (rawData) {
                arrayPermisos = Array.isArray(rawData) ? rawData : [rawData];
            }

            setPermisosUsuario(arrayPermisos);
            console.log('Permisos Tela obtenidos:', arrayPermisos);

            if (arrayPermisos.length > 0) {
                const nombresPantallasPermitidas = arrayPermisos
                    .map(p => p.pantalla)
                    .filter((p): p is string => Boolean(p));

                console.log('Pantallas permitidas en Tela:', nombresPantallasPermitidas);

                const pantallasFiltradas = TODAS_LAS_PANTALLAS_TELA.filter(item =>
                    nombresPantallasPermitidas.includes(item.Screen)
                );

                console.log('Pantallas filtradas Tela:', pantallasFiltradas);
                setData(pantallasFiltradas.length > 0 ? pantallasFiltradas : TODAS_LAS_PANTALLAS_TELA);
            } else {
                setData(TODAS_LAS_PANTALLAS_TELA);
            }
        } catch (err) {
            console.log('Error al obtener permisos en modulo Tela:', err);
            setData(TODAS_LAS_PANTALLAS_TELA);
        } finally {
            setCargando(false);
        }
    };

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
                            style={{ width: 180, height: 100, resizeMode: 'contain' }}
                        />
                        <Text style={{ color: navy, textAlign: 'center' }}>{item.Name}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey }}>
            <Header texto1='' texto2='Menu Tela' texto3='' />

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
    );
};