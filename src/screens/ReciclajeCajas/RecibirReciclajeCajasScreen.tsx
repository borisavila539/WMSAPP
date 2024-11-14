import React, { FC, useEffect, useState } from 'react'

import { RootStackParams } from '../../navigation/navigation'
import { StackScreenProps } from '@react-navigation/stack'
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import { green, grey } from '../../constants/Colors'
import Header from '../../components/Header'
import { ReciclajeCajasPendientes } from '../../interfaces/ReciclajeCajas/ReciclajeCajasCentroCostosInterface'
import { WmSApi } from '../../api/WMSApi'
import MyAlert from '../../components/MyAlert'

type props = StackScreenProps<RootStackParams, "RecibirReciclajeCajasScreen">
export const RecibirReciclajeCajasScreen: FC<props> = ({ navigation }) => {
    const [pendiente, setPendiente] = useState<ReciclajeCajasPendientes[]>([])
    const [showMensajeAlerta, setShowMensajeAlerta] = useState<boolean>(false);
    const [tipoMensaje, setTipoMensaje] = useState<boolean>(false);
    const [mensajeAlerta, setMensajeAlerta] = useState<string>('');
    const [enviando, setEnviando] = useState<boolean>(false);
    

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
            <View style={{ width: '100%', borderRadius: 10, margin: 2, padding: 5, borderWidth: 2,flexDirection: 'row' }}>
                <View style={{ backgroundColor: grey, width: '79%', }} >
                    <Text>Diario:{item.diario}</Text>
                    <Text>Camion: {item.camion} / Chofer: {item.chofer}</Text>
                    <Text>Cantidad: {item.qty}</Text>
                    <Text>Fecha: {item.fecha.toString()}</Text>
                </View>
                <View style={{ width: '19%',justifyContent: 'center' }} >
                    <TouchableOpacity style={{backgroundColor: green,borderRadius:5,alignItems: 'center',paddingVertical:7}} onPress={()=>onPress(item.diario)} disabled={enviando}>
                        <Text style={{color:'#fff'}}>Recibir</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )

    }

    const onPress =async(diario:string)=>{
        setEnviando(true)
        try {

            await WmSApi.get<string>(`ReciclajeCajas/-/0/${diario}/-/-/-`).then(resp => {
                if (resp.data == "OK") {
                    setMensajeAlerta(`Se registro ${diario}`)
                    setTipoMensaje(true);
                    setShowMensajeAlerta(true);                    
                    getPendientes()
                }
            })
        } catch (err) {
            setMensajeAlerta(`Error ${err}`)
            setTipoMensaje(false);
            setShowMensajeAlerta(true);
        }
        setEnviando(false)
    }

    useEffect(() => {
        getPendientes()
    }, [])

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='' texto2='Recibir Reciclaje Caja' texto3='' />
            {
                pendiente.length > 0 ?
                <View style={{ width: '90%', flex: 1 }}>
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
                :
                <Text>No hay diarios Pendientes</Text>

            }
            <MyAlert visible={showMensajeAlerta} tipoMensaje={tipoMensaje} mensajeAlerta={mensajeAlerta} onPress={() => setShowMensajeAlerta(false)} />

        </View>
    )
}
