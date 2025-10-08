import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl } from "react-native";
import Header from "../../../components/Header";
import { black, grey } from "../../../constants/Colors";
import React, { FC, useState, useEffect } from 'react';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParams } from "../../../navigation/navigation";
import { ConsultaOpsPorBaseInterface } from "../../../interfaces/Serigrafia/OpPorBaseInterface";
import { WMSApiSerigrafia } from "../../../api/WMSApiSerigrafia";
import { WMSContext } from "../../../context/WMSContext";
import { Icon } from "react-native-elements";
import Dropdown from "../ComponenteGenricos/Dropdowm";
import { OrderCard } from "../ComponenteGenricos/OrderCard";

type Props = StackScreenProps<RootStackParams, 'ConsultaPorOPsBaseScreen'>;

export const ConsultaPorOPsBaseScreen: FC<Props> = ({ navigation }) => {
    const [data, setData] = useState<ConsultaOpsPorBaseInterface[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const [cargando, setCargando] = useState(false);
    const [refreshing, setRefreshing] = useState(false); 
    const { WMSState } = React.useContext(WMSContext);
    const [selectedStyle, setSelectedStyle] = useState("");

    const styleOptions = Array.from(
        new Set(data.map(order => order.itemIdEstilo))
    );

    const getData = async () => {
        setCargando(true);
        try {
            const resp = await WMSApiSerigrafia.get<ConsultaOpsPorBaseInterface[]>(
                `GetOpsPrepardas/${WMSState.itemId}`
            );
            setData(resp.data);
            console.log(resp.data);
        } catch (err) {
            console.log("Error fetching data", err);
        } finally {
            setCargando(false);
            setRefreshing(false); 
        }
    };

    useEffect(() => {
        getData();
    }, []);

    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    
    const onRefresh = () => {
        setRefreshing(true);
        getData();
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header texto1="" texto2="Inicio Ops" texto3="" />

            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
                <View style={styles.searchRow}>
                    <View style={styles.searchInputContainer}>
                        <TextInput
                            style={styles.searchInput}
                            value={searchText}
                            onChangeText={handleSearch}
                            placeholder="Buscar OP..."
                            autoFocus
                        />
                        <Icon name='search' size={15} color={black} />
                    </View>
                </View>

                <Dropdown
                    options={styleOptions}
                    selectedOption={selectedStyle}
                    placeholder="Selecciona un estilo"
                    onSelect={(value) => setSelectedStyle(value)}
                    includeAll={true}
                />
            </View>

            {/* Lista de órdenes */}
            <ScrollView
                style={styles.ordersList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[black]} 
                        tintColor={black} 
                    />
                }
            >
                {cargando && <ActivityIndicator size="large" color={black} />}
                {data
                    .filter((o) => {
                        const matchSearch =
                            o.prodMasterId.toLowerCase().includes(searchText.toLowerCase()) ||
                            o.itemIdEstilo.toLowerCase().includes(searchText.toLowerCase());

                        const matchStyle =
                            !selectedStyle || selectedStyle === "All" || o.itemIdEstilo === selectedStyle;
                        
                        return matchSearch && matchStyle;
                    })
                    .map((order, index) => (
                        <OrderCard key={`${order.prodMasterId}-${index}`} order={order} />
                    ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: grey },
    searchContainer: { backgroundColor: "white", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
    searchRow: { flexDirection: "row" },
    searchInputContainer: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, paddingHorizontal: 10 },
    searchInput: { flex: 1, height: 40, fontSize: 14 },
    ordersList: { flex: 1, padding: 16 },
});
