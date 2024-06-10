import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { RootStackParams } from '../../../navigation/navigation'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Header from '../../../components/Header'
import { black, green, grey, orange, yellow } from '../../../constants/Colors'
import { WMSContext } from '../../../context/WMSContext'
import { DespachoPTCajasAuditarInterface } from '../../../interfaces/DespachoPT/Auditar/DespachoPTCajasAuditarInterface'
import { WmSApi } from '../../../api/WMSApi'
import Icon from 'react-native-vector-icons/FontAwesome5'
import SoundPlayer from 'react-native-sound-player'

type props = StackScreenProps<RootStackParams, "DespachoPTAuditoriaCajas">

export const DespachoPTAuditoriaCajas: FC<props> = ({ navigation }) => {
    const { WMSState,changeBox,changeProdID } = useContext(WMSContext)
    const textInputRef = useRef<TextInput>(null);
    const [cajas, setCajas] = useState<DespachoPTCajasAuditarInterface[]>([])
    const [ProdIDBox, setProdIDBox] = useState<string>('')
    const [cargando, setCargando] = useState<boolean>(false);

    const getCajasAuditar = async () => {
        try {
            await WmSApi.get<DespachoPTCajasAuditarInterface[]>(`DespachoPTCajasAuditar/${WMSState.DespachoID}`).then(resp => {
                setCajas(resp.data)
            })
        } catch (err) {

        }
    }

    const renderItem = (item: DespachoPTCajasAuditarInterface) => {
        const getColor = (): string => {
            if (item.auditado == 0) {
                return grey
            } else if (item.auditado <= (item.qty / 2)) {
                return yellow
            } else if (item.auditado > (item.qty / 2) && item.auditado < item.qty) {
                return orange
            } else {
                return green
            }
        }

        return (
            <View style={{ width: '50%', alignItems: 'center' }}>
                <View style={{ width: '95%', backgroundColor: getColor(), borderRadius: 10, marginBottom: 5, padding: 5, borderWidth: 1 }}>
                    <Text style={style.textRender}>{item.prodID}</Text>
                    <Text style={style.textRender}>Talla: {item.size}</Text>
                    <Text style={style.textRender}>Color {item.color}</Text>
                    <Text style={style.textRender}>Caja: {item.box}</Text>
                    <Text style={style.textRender}>QTY: {item.qty}</Text>
                    <Text style={style.textRender}>Auditado: {item.auditado}</Text>
                </View>
            </View>
        )
    }

    const PlaySound = (estado: string) => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }

    const validarCaja = () =>{
        let Prod = ProdIDBox.split(',');
        let qty: number|undefined = cajas.find(x => x.prodID == Prod[0] && x.box == parseInt(Prod[1]))?.qty 
        if(qty){
            PlaySound('success')
            setProdIDBox('')
            changeProdID(Prod[0])
            changeBox(parseInt(Prod[1]))
            navigation.navigate('DespachoPTAuditoriaCajasLineas')

        }else{
            PlaySound('error')
            setProdIDBox('')
        }
        
    }

    useEffect(() => {
        getCajasAuditar()
    }, [])

    useEffect(()=>{
        if (ProdIDBox.length > 0) {
            validarCaja()
            textInputRef.current?.blur()
        }
    },[ProdIDBox])

    return (
        <View style={{ flex: 1, width: '100%', backgroundColor: grey, alignItems: 'center' }}>
            <Header texto1='' texto2={'Auditoria Despacho:' + WMSState.DespachoID} texto3='' />
            <View style={[style.textInput, { borderColor: '#77D970' }]}>
                <TextInput
                    ref={textInputRef}
                    onChangeText={(value) => { setProdIDBox(value) }}
                    value={ProdIDBox}
                    style={style.input}
                    placeholder='Escanear Caja...'
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
            <FlatList
                data={cajas}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => renderItem(item)}
                showsVerticalScrollIndicator={false}
                numColumns={2}
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => getCajasAuditar()} colors={['#069A8E']} />
                }
            />

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
        color: black
    }
})
