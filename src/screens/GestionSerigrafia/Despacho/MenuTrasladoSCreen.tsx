import React, { FC, useContext, useEffect, useState } from "react";
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from "../../../navigation/navigation";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { grey, navy } from "../../../constants/Colors";
import Header from "../../../components/Header";
import { ScreensInterface } from "../../../interfaces/ScreeensInterface";


type props = StackScreenProps<RootStackParams, "MenuTrasladoSCreen">;
export const MenuTrasladoSCreen: FC<props> = ({ navigation }) => {
    const [data, setData] = useState<ScreensInterface[]>([]);

    const setScreens = () => {
        let tmp: ScreensInterface[] = [
            { Name: 'Gestionar Diarios', Screen: 'CrearDiariosCreen', image: require('../../../assets/GestionDiario.png') },
            { Name: 'Crear Traslados', Screen: 'ConsultaCreacionTrasladosScreen', image: require('../../../assets/CreacionTraslado.png') },
            { Name: 'Consultar Traslados', Screen: 'ConsultaTrasladoCreadosScreen', image: require('../../../assets/ConsultaTraslado.png') },
            { Name: 'Despacho', Screen: 'CreacionDespachoPakingScreen', image: require('../../../assets/CrearDespacho.png') },
           { Name: 'Recibir Despacho', Screen: 'EscorgerTrasladoParaRecibirScreen', image: require('../../../assets/RecibirTraslado.png') },
        ]
        setData(tmp)
    }

    const renderItem = (item: ScreensInterface) => {
        return (
            <View style={{ width: '50%', alignItems: 'center' }}>
                <View style={{ width: '95%', borderWidth: 1, alignItems: 'center', borderRadius: 15, paddingVertical: 5, marginTop: 5 }}>
                    <TouchableOpacity onPress={() => navigation.navigate(item.Screen)}>
                        <Image
                            source={item.image}
                            style={{ width: 100, height: 100, resizeMode: 'contain' }}
                        />
                        <Text style={{ color: navy, textAlign: 'center' }}>{item.Name}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
    
    useEffect(() => {
        setScreens()
    }, [])
    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey }}>
            <Header texto1='' texto2="Menu Traslado" texto3= "" />
            <FlatList
                data={data}
                keyExtractor={(item) => item.Screen.toString()}
                renderItem={({ item, index }) => renderItem(item)}
                showsVerticalScrollIndicator={false}
                numColumns={2}
            />
        </View>
    )
}