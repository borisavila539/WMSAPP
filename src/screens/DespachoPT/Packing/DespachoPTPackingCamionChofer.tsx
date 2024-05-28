import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useCallback, useContext, useEffect, useState } from 'react'
import { FlatList, Image, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { Text } from 'react-native-elements'
import { RootStackParams } from '../../../navigation/navigation'
import Header from '../../../components/Header'
import { black, blue, grey, orange } from '../../../constants/Colors'
import { WmSApi } from '../../../api/WMSApi'
import { WMSContext } from '../../../context/WMSContext';
import { CrearDespachoPTInterface } from '../../../interfaces/DespachoPT/Packing/CrearDespachoPTInterface'
import { DespachosPTInterface } from '../../../interfaces/DespachoPT/Packing/DespachosPTInterface'
import { getAdapter } from 'axios'
import MyAlert from '../../../components/MyAlert'
type props = StackScreenProps<RootStackParams, "DespachoPTPackingCamionChofer">

export const DespachoPTPackingCamionChofer: FC<props> = ({ navigation }) => {
  const [camion, setCamion] = useState<string>('')
  const [Chofer, setChofer] = useState<string>('')
  const { changeDespachoID, changeCamion, changeChofer, WMSState } = useContext(WMSContext)
  const [Despachos, setDespachos] = useState<DespachosPTInterface[]>([])
  const [showMensajeAlerta, setShowMensajeAlerta] = useState<boolean>(false);
  const [tipoMensaje, setTipoMensaje] = useState<boolean>(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<string>('');

  const crearDespacho = async () => {
    if (camion != '' && Chofer != '') {
      changeCamion(camion)
      changeChofer(Chofer)
      try {
        await WmSApi.get<CrearDespachoPTInterface>(`Crear_Despacho_PT/${Chofer}/${camion}/${WMSState.usuario}/${WMSState.usuarioAlmacen}`).then(resp => {
          changeDespachoID(resp.data.id)
          navigation.navigate('DespachoPTPacking')
        })
      } catch (err) {
        console.log(err)
      }
    } else {
      setMensajeAlerta('Campo ' + (camion == '' ? 'Camion' : 'Chofer') + ' es obligatorio')
      setTipoMensaje(false)
      setShowMensajeAlerta(true)
    }

  }

  const getDespachos = async () => {
    try {
      await WmSApi.get<DespachosPTInterface[]>(`ObtenerDespachosPT/Pendiente/${WMSState.usuarioAlmacen}/0`).then(resp => {
        setDespachos(resp.data)
      })
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    getDespachos()
  }, [])

  const renderItem = (item: DespachosPTInterface) => {
    return (
      <View style={{ width: '100%', alignItems: 'center' }}>
        <View style={{ backgroundColor: grey, width: '95%', borderRadius: 10, margin: 2, padding: 5, borderWidth: 2, borderColor: blue }} >
          <TouchableOpacity style={{ width: '100%' }}  onPress={()=>{
            changeDespachoID(item.id)
            changeCamion(item.truck)
            changeChofer(item.driver)
            navigation.navigate('DespachoPTPacking')
          }}>
            <Text>Despacho: {item.id.toString().padStart(8, '0')}</Text>
            <Text>Motorista: {item.driver} / {item.truck}</Text>
            <Text>Fecha: {item.createdDateTime.toString()}</Text>
          </TouchableOpacity>

        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>

      <Header texto1='' texto2='Despacho PT Packing' texto3={WMSState.DespachoID + ''} />
      <Image
        source={require('../../../assets/Packing.png')}
        style={{ width: 100, height: 100, resizeMode: 'contain' }}
      />
      <View style={style.textInput}>

        <TextInput
          placeholder='Camion'
          placeholderTextColor={'#fff'}
          onChangeText={(value) => setCamion(value)}
          value={camion}
          style={style.input}
        />
      </View>
      <Image
        source={require('../../../assets/Chofer.png')}
        style={{ width: 110, height: 110, resizeMode: 'contain' }}
      />
      <View style={style.textInput}>
        <TextInput
          placeholder='Chofer'
          placeholderTextColor={'#fff'}
          onChangeText={(value) => setChofer(value)}
          value={Chofer}
          style={style.input}
        />
      </View>
      <TouchableOpacity style={{ backgroundColor: orange, width: '90%', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}
        onPress={crearDespacho}>
        <Text style={{ color: grey }}>Crear Despacho</Text>
      </TouchableOpacity>
      <View style={{ width: '100%', marginTop: 5, flex: 1 }}>

        <FlatList
          data={Despachos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => renderItem(item)}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => getDespachos()} colors={['#069A8E']} />
          }
        />
      </View>
      <MyAlert visible={showMensajeAlerta} tipoMensaje={tipoMensaje} mensajeAlerta={mensajeAlerta} onPress={() => setShowMensajeAlerta(false)} />

    </View>
  )
}

const style = StyleSheet.create({
  input: {
    flex: 3,
    padding: 5,
    marginLeft: 10,
    color: black
  },
  textInput: {
    width: '90%',
    backgroundColor: grey,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    borderWidth: 1,
    marginTop: 5,

  }
})

