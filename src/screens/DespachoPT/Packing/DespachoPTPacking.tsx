import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { RootStackParams } from '../../../navigation/navigation'
import { WMSContext } from '../../../context/WMSContext'
import Header from '../../../components/Header'
import { black, grey } from '../../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { WmSApi } from '../../../api/WMSApi'
import { PackingEnviarCajainterface } from '../../../interfaces/DespachoPT/Packing/PackingEnviarCajaInterface'
import SoundPlayer from 'react-native-sound-player'
import MyAlert from '../../../components/MyAlert'


type props = StackScreenProps<RootStackParams, "DespachoPTPacking">

export const DespachoPTPacking: FC<props> = ({ navigation }) => {
  const { WMSState } = useContext(WMSContext);
  const [ProdIDBox, setProdIDBox] = useState<string>('')
  const textInputRef = useRef<TextInput>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [showMensajeAlerta, setShowMensajeAlerta] = useState<boolean>(false);
  const [tipoMensaje, setTipoMensaje] = useState<boolean>(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<string>('');

  const PlaySound = (estado: string) => {
    try {
      SoundPlayer.playSoundFile(estado, 'mp3')
    } catch (err) {
      console.log(err)
    }
  }

  const getData = () => {

  }

  const AgregarCajapacking = async () => {
    if (!cargando) {
      setCargando(true)
      try {

        let Prod = ProdIDBox.split(',');
        await WmSApi.get<PackingEnviarCajainterface>(`packingDespachoPT/${Prod[0]}/${WMSState.usuario}/${Prod[1]}/${WMSState.DespachoID}`).then(resp => {
          if (resp.data.packing) {
            PlaySound('success')
          } else {
            PlaySound('error')
            setMensajeAlerta('Favor colocar unidades de 2da y 3eras')
            setTipoMensaje(false)
            setShowMensajeAlerta(true)
          }
          setProdIDBox('')
        })
      } catch (err) {

      }
      setCargando(false)
    }
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