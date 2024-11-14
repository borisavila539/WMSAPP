import React, { FC, useContext, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { RootStackParams } from '../../navigation/navigation'
import { StackScreenProps } from '@react-navigation/stack'
import { grey, orange } from '../../constants/Colors'
import Header from '../../components/Header'
import { WmSApi } from '../../api/WMSApi'
import { ReciclajeCajasCentroCostosInterface, ReciclajeCajasPendientes } from '../../interfaces/ReciclajeCajas/ReciclajeCajasCentroCostosInterface'
import { SelectList } from 'react-native-dropdown-select-list'
import MyAlert from '../../components/MyAlert'
import { WMSContext } from '../../context/WMSContext'

type props = StackScreenProps<RootStackParams, "EnviarReciclajeCajaScreen">
export const EnviarReciclajeCajaScreen: FC<props> = ({ navigation }) => {
    const [CentroCostos, setCentroCosto] = useState<{ key: string, value: string }[]>([])
    const [selected, setSelected] = useState<string>("")
    const [Camion, setCamion] = useState<string>("")
    const [Chofer, setChofer] = useState<string>("")
    const [QTY, setQTY] = useState<string>("")
    const [enviar, setEnviar] = useState<boolean>(false)
    const [showMensajeAlerta, setShowMensajeAlerta] = useState<boolean>(false);
    const [tipoMensaje, setTipoMensaje] = useState<boolean>(false);
    const [mensajeAlerta, setMensajeAlerta] = useState<string>('');
    const [pendiente, setPendiente] = useState<ReciclajeCajasPendientes[]>([])

    const { WMSState } = useContext(WMSContext)

    const getCentrosCosto = () => {
        try {
            WmSApi.get<ReciclajeCajasCentroCostosInterface[]>('ReciclajeCajasCentroCostos').then(resp => {
                let data: { key: string, value: string }[] = []
                resp.data.forEach(elem => {
                    data.push({ key: elem.iM_CENTRO_DE_COSTOS, value: elem.iM_CENTRO_DE_COSTOS + '-' + elem.name })
                })
                setCentroCosto(data)
            })

        } catch (err) {

        }
    }

    const onPress = async () => {
        setEnviar(true)
        if (Camion == "") {
            setMensajeAlerta('Ingrese Camion')
            setTipoMensaje(false);
            setShowMensajeAlerta(true);
        } else if (Chofer == "") {
            setMensajeAlerta('Ingrese Chofer')
            setTipoMensaje(false);
            setShowMensajeAlerta(true);
        } else if (QTY == "" || QTY == "0") {
            setMensajeAlerta('ingrese Cantidad')
            setTipoMensaje(false);
            setShowMensajeAlerta(true);
        }
        else if (selected == "") {
            setMensajeAlerta('seleccione Almacen')
            setTipoMensaje(false);
            setShowMensajeAlerta(true);
        } else {
            try {

                await WmSApi.get<string>(`ReciclajeCajas/${selected}/${QTY}/-/${Camion}/${Chofer}/${WMSState.usuario}`).then(resp => {
                    if (resp.data.startsWith('DIA')) {
                        setMensajeAlerta(`Se genero ${resp.data}`)
                        setTipoMensaje(true);
                        setShowMensajeAlerta(true);
                        setQTY('')
                        getPendientes()
                    }
                })
            } catch (err) {
                setMensajeAlerta(`Error ${err}`)
                setTipoMensaje(false);
                setShowMensajeAlerta(true);
            }
        }
        setEnviar(false)
    }

    const getPendientes = async () => {
        try {
            await WmSApi.get<ReciclajeCajasPendientes[]>('ReciclajeCajasPendientes').then(resp => {
                setPendiente(resp.data)
            })
        } catch (err) {

        }
    }

    const renderItem = (item: ReciclajeCajasPendientes) => {
        return (
            <View style={{ width: '100%', alignItems: 'center' }}>
                <View style={{ backgroundColor: grey, width: '100%', borderRadius: 10, margin: 2, padding: 5, borderWidth: 2 }} >
                    <Text>Diario:{item.diario}</Text>
                    <Text>Camion: {item.camion} / Chofer: {item.chofer}</Text>
                    <Text>Cantidad: {item.qty}</Text>
                    <Text>Fecha: {item.fecha.toString()}</Text>
                </View>
            </View>
        )

    }
    useEffect(() => {
        getCentrosCosto()
        getPendientes()
    }, [])
    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='' texto2='Enviar Reciclaje Caja' texto3='' />
            <View style={{ width: '80%', paddingTop: 10 }}>
                <TextInput
                    style={styles.input}
                    onChangeText={(value) => setCamion(value)}
                    value={Camion}
                    placeholder='Camion'
                />
                <TextInput
                    style={styles.input}
                    onChangeText={(value) => setChofer(value)}
                    value={Chofer}
                    placeholder='Chofer'
                />
                <TextInput
                    style={styles.input}
                    onChangeText={(value) => setQTY(value)}
                    value={QTY}
                    placeholder='Cantidad Cajas'
                    keyboardType='decimal-pad'
                />
                {
                    CentroCostos.length > 0 &&
                    <SelectList
                        setSelected={(val: string) => setSelected(val)}
                        data={CentroCostos}
                        save='key'
                        placeholder='Seleccione Almacen'
                    />
                }

                <TouchableOpacity style={{ backgroundColor: orange, width: '100%', borderRadius: 10, paddingVertical: 8, alignItems: 'center', marginTop: 3 }} onPress={onPress} disabled={enviar}>
                    {
                        !enviar ?
                            <Text style={{ color: grey }}>Enviar</Text>
                            :
                            <ActivityIndicator size={20} color={'#fff'} />

                    }
                </TouchableOpacity>



            </View>
            {
                pendiente.length > 0 &&
                <View style={{ width: '80%',flex:1 }}>
                    <FlatList
                        data={pendiente}
                        keyExtractor={(item) => item.diario}
                        renderItem={({ item, index }) => renderItem(item)}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={false} onRefresh={() => getPendientes()} colors={['#069A8E']} />
                        }
                    />
                </View>

            }
            <MyAlert visible={showMensajeAlerta} tipoMensaje={tipoMensaje} mensajeAlerta={mensajeAlerta} onPress={() => setShowMensajeAlerta(false)} />

        </View>
    )
}
const styles = StyleSheet.create({
    input: {
        backgroundColor: grey,
        borderWidth: 1,
        borderRadius: 10,
        width: '100%',
        textAlign: 'center',
        marginBottom: 3
    }
})
