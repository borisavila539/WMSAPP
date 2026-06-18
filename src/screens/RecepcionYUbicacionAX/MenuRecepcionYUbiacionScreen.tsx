import { FC, useContext, useEffect, useState } from "react";
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from "../../navigation/navigation";
import { ScreensInterface } from "../../interfaces/ScreeensInterface";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { grey, navy } from '../../constants/Colors'
import Header from '../../components/Header'
import { WMSContext } from "../../context/WMSContext";
import { WmSApi } from "../../api/WMSApi";

type props = StackScreenProps <RootStackParams, "MenuRecepcionYUbiacionScreen">;
export const MenuRecepcionYUbiacionScreen: FC<props> = ({ navigation}) => {
    const [data, setData] = useState<ScreensInterface[]>([]);
    const { WMSState } = useContext(WMSContext);

    const setScreens = () => {
        let tmp: ScreensInterface[] = [
            { Name: 'Recepcion Ubicacion Caja', Screen: 'RecepcionUbicacionCajasScreen', image: require('../../assets/DiarioEntrada.png') },
            { Name: 'MB', Screen: 'MenuMB', image: require('../../assets/DiarioEntrada.png') },
            { Name: 'Recepcion Traslados', Screen: 'RecepcionTrasladosScreen', image: require('../../assets/DespachoSRG.png') },
            
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
            <Header texto1='' texto2="Recepción y Ubicación" texto3= "" />
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