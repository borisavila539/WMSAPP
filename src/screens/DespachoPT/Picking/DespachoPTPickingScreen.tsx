import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { Text } from 'react-native-elements'
import { RootStackParams } from '../../../navigation/navigation'
import Header from '../../../components/Header'
import { black, grey, orange } from '../../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { WmSApi } from '../../../api/WMSApi'
import { InsertBoxesDespachoPTInterface } from '../../../interfaces/DespachoPT/Picking/InsertBoxesDespachoPT'
import { WMSContext } from '../../../context/WMSContext'
import SoundPlayer from 'react-native-sound-player'
import { PickingDespachoPTInterface } from '../../../interfaces/DespachoPT/Picking/PickingDespachoPTInterface'


type props = StackScreenProps<RootStackParams, "DespachoPTPickingScreen">

export const DespachoPTPickingScreen: FC<props> = ({ navigation }) => {
    const [ProdIDBox, setProdIDBox] = useState<string>('')
    const textInputRef = useRef<TextInput>(null);
    const [cargando, setCargando] = useState<boolean>(false);
    const { WMSState } = useContext(WMSContext);
    const [data, setData] = useState<PickingDespachoPTInterface[]>([])
    

    const getData = async () => {
        setCargando(true)
        try {
            await WmSApi.get<PickingDespachoPTInterface[]>(`PickingDespachoPT/${WMSState.usuarioAlmacen}`).then((resp) => { //Colocar almacen
                setData(resp.data)
                console.log(resp.data)
            })
        } catch (err) {

        }
        setCargando(false)
    }
    const AgregarCajapicking = async () => {
        if (!cargando) {
            setCargando(true)

            try {
                let Prod = ProdIDBox.split(',');

                console.log(Prod)

                await WmSApi.get<InsertBoxesDespachoPTInterface[]>(`InsertBoxesDespachoPT/${Prod[0]}/${WMSState.usuario}/${Prod[1]}`).then((resp) => {
                    console.log(resp.data)
                    if (resp.data.length > 0) {
                        PlaySound('success')
                        getData()
                    } else {
                        PlaySound('error')
                    }
                })
            } catch (err) {
                console.log(err)
                PlaySound('error')
            }
            setProdIDBox('')
            setCargando(false)
        }

    }

    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }

    const renderItem = (item: PickingDespachoPTInterface) => {
        const fecha = ():string =>{
            const fechaS = new Date(item.fechaPicking);
            return fechaS.getDate() + '/' + fechaS.getMonth() + '/' + fechaS.getFullYear()
        }
        
        return (
            <View style={{ width: '50%', alignItems: 'center' }}>
                <View style={{ width: '95%', backgroundColor: orange, borderRadius: 10, marginBottom: 5, padding: 5 }}>
                    <Text style={style.textRender}>{item.prodID}</Text>
                    <Text style={style.textRender}>Talla: {item.size}</Text>
                    <Text style={style.textRender}>QTY: {item.qty}</Text>
                    <Text style={style.textRender}>Color {item.color}</Text>
                    <Text style={style.textRender}>Caja: {item.box}</Text>
                    <Text style={style.textRender}>Fecha: {fecha()}</Text>
                </View>
            </View>
        )
    }


    useEffect(() => {
        getData()
    }, [])
    useEffect(() => {
        if (ProdIDBox.length > 0) {
            AgregarCajapicking()
            textInputRef.current?.blur()
        }
    }, [ProdIDBox])

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='' texto2='Despacho PT Picking' texto3={'Cajas: '+data.length} />
            <View style={[style.textInput, { borderColor: '#77D970' }]}>
                <TextInput
                    ref={textInputRef}
                    onChangeText={(value) => { setProdIDBox(value) }}
                    value={ProdIDBox}
                    style={style.input}
                    placeholder='Escanear Ingreso...'
                    autoFocus
                    onBlur={() => textInputRef.current?.isFocused() ? null : textInputRef.current?.focus()}

                />
                {!cargando ?
                    <TouchableOpacity onPress={() => setProdIDBox('')}>
                        <Icon name='times' size={15} color={black} />
                    </TouchableOpacity>
                    :
                    <ActivityIndicator size={20} />
                }
            </View>
            <View style={{ flex: 1, width: '100%' }}>
                {
                    data.length > 0 &&
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item, index }) => renderItem(item)}
                        showsVerticalScrollIndicator={false}
                        numColumns={2}
                        
                    />
                }
            </View>
        </View>
    )
}

const style = StyleSheet.create({
    textInput: {
        maxWidth: 450,
        width: '95%',
        backgroundColor: grey,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 5,
        borderWidth: 2
    },
    input: {
        width: '90%',
        textAlign: 'center'
    },
    textRender: {
        color: grey
    }
})