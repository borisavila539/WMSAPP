import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { RootStackParams } from '../../../navigation/navigation'
import { WMSContext } from '../../../context/WMSContext'
import Header from '../../../components/Header'
import { black, grey, orange } from '../../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { WmSApi } from '../../../api/WMSApi'
import { PackingEnviarCajainterface } from '../../../interfaces/DespachoPT/Packing/PackingEnviarCajaInterface'
import SoundPlayer from 'react-native-sound-player'
import MyAlert from '../../../components/MyAlert'
import { PickingPackingRecepcionDespachoPTInterface } from '../../../interfaces/DespachoPT/Picking/PickingDespachoPTInterface'


type props = StackScreenProps<RootStackParams, "DespachoPTPacking">

export const DespachoPTPacking: FC<props> = ({ navigation }) => {
  const { WMSState } = useContext(WMSContext);
  const [ProdIDBox, setProdIDBox] = useState<string>('')
  const textInputRef = useRef<TextInput>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [showMensajeAlerta, setShowMensajeAlerta] = useState<boolean>(false);
  const [tipoMensaje, setTipoMensaje] = useState<boolean>(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<string>('');
  const [data,setData] = useState<PickingPackingRecepcionDespachoPTInterface[]>([])

  const PlaySound = (estado: string) => {
    try {
      SoundPlayer.playSoundFile(estado, 'mp3')
    } catch (err) {
      console.log(err)
    }
  }

  const getData = async() => {
    setCargando(true)
        try {
            await WmSApi.get<PickingPackingRecepcionDespachoPTInterface[]>(`PackingDespachoPT/${WMSState.DespachoID}`).then((resp) => { //Colocar almacen
                setData(resp.data)
                console.log(resp.data)
            })
        } catch (err) {

        }
        setCargando(false)
  }

  const AgregarCajapacking = async () => {
    if (!cargando) {
      setCargando(true)
      try {

        let Prod = ProdIDBox.split(',');
        await WmSApi.get<PackingEnviarCajainterface>(`packingDespachoPT/${Prod[0]}/${WMSState.usuario}/${Prod[1]}/${WMSState.DespachoID}`).then(resp => {
          if (resp.data.packing) {
            PlaySound('success')
            getData()
          } else {
            PlaySound('error')
            setMensajeAlerta('Favor colocar unidades de 2da y 3eras o no fue escaneada en Picking')
            setTipoMensaje(false)
            setShowMensajeAlerta(true)
          }
          
        })
      } catch (err) {
        PlaySound('error')
      }
      setProdIDBox('')
      setCargando(false)
    }
  }

  const renderItem = (item: PickingPackingRecepcionDespachoPTInterface) => {
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
      AgregarCajapacking()
      textInputRef.current?.blur()
    }
  }, [ProdIDBox])
  return (
    <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
      <Header texto2={'Camion: ' + WMSState.Camion + ' Chofer: ' + WMSState.Chofer} texto3={''} texto1={WMSState.TRANSFERIDFROM + '-' + WMSState.TRANSFERIDTO} />
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
                        refreshControl={
                          <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
                        }
                    />
                }
            </View>
      <MyAlert visible={showMensajeAlerta} tipoMensaje={tipoMensaje} mensajeAlerta={mensajeAlerta} onPress={() => setShowMensajeAlerta(false)} />

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