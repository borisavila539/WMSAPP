import { FC, useContext, useEffect, useState } from "react";
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from "../../navigation/navigation";
import { ScreensInterface } from "../../interfaces/ScreeensInterface";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { grey, navy } from '../../constants/Colors'
import Header from '../../components/Header'
import { WMSContext } from "../../context/WMSContext";
import { WmSApi } from "../../api/WMSApi";

type props = StackScreenProps <RootStackParams, "MenuFlujoProcesoScreen">;
export const MenuFlujoProcesoScreen: FC<props> = ({ navigation}) => {
    const [data, setData] = useState<ScreensInterface[]>([]);
    const { WMSState } = useContext(WMSContext);
    const tituloConBase = `Base: ${WMSState.itemId}`
    const tituloLote = `Lote: ${WMSState.lote}`
    const setScreens = () => {
        let tmp: ScreensInterface[] = [
            { Name: 'Preparación por Base', Screen: 'ConsultaConsolidadoOpPorColorScreen', image: require('../../assets/Preparar.png') },
            { Name: 'Iniciar Ops', Screen: 'ConsultaInicioPorOPsBaseScreen', image: require('../../assets/Iniciar.png') },
            { Name: 'Terminar Ops', Screen: 'ConsultaTerminarOpsPorBaseScreen', image: require('../../assets/Terminado.png') },
           
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
            <Header texto1='Flujo de Proceso' texto2={tituloConBase} texto3= {tituloLote} />
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