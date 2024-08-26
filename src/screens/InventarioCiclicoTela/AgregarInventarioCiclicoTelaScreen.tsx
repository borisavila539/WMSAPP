import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useState } from 'react'
import { RootStackParams } from '../../navigation/navigation'
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Header from '../../components/Header'
import { WMSContext } from '../../context/WMSContext'
import { black, green, grey } from '../../constants/Colors'
import { WmSApi } from '../../api/WMSApi'
import { DetalleInventarioCliclicoTelainterface } from '../../interfaces/InventarioCiclicoTela/DetalleInventarioCliclicoTelainterface'

type props = StackScreenProps<RootStackParams, "AgregarInventarioCiclicoTelaScreen">


export const AgregarInventarioCiclicoTelaScreen: FC<props> = ({ navigation }) => {
  const { WMSState } = useContext(WMSContext)
  const [InventSertialID, setInventSerialID] = useState<string>('')
  const [WMSLOCATIONID, setWMSLOCATIONID] = useState<string>('')
  const [cantidad, setCantidad] = useState<string>('')
  const [enviando, setEnviando] = useState<boolean>(false)


  const agregarNuevo = async () => {
    setEnviando(true)
    try{
      await WmSApi.get<DetalleInventarioCliclicoTelainterface>(`AgregarInventarioCilicoTela/${WMSState.diario}/${InventSertialID}/${WMSLOCATIONID}/${cantidad}`)
      .then(resp=>{
        if(resp.data.inventSerialID != ''){
          navigation.goBack()
        }
      })
    }catch(err){

    }
    setEnviando(false)

  }
  return (
    <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
      <Header texto1='Agregar Ciclico Tela' texto2={WMSState.diario} texto3='' />
      <TextInput
        placeholder='Rollo'
        style={styles.input}
        onChangeText={(value) => setInventSerialID(value)}
        value={InventSertialID} />
      <TextInput
        placeholder='Ubicacion'
        style={styles.input}
        onChangeText={(value) => setWMSLOCATIONID(value)}
        value={WMSLOCATIONID} />
      <TextInput
        placeholder='Cantidad Libras/Yardas'
        style={styles.input}
        onChangeText={(value) => setCantidad(value)}
        value={cantidad}
        keyboardType='numeric' />
      {
        InventSertialID != '' && WMSLOCATIONID != '' && cantidad != '' &&
        <TouchableOpacity style={{ backgroundColor: green, width: '90%', alignItems: 'center', borderRadius: 10, paddingVertical: 7, marginTop:5 }} onPress={agregarNuevo}>
          {
            enviando ?
              <ActivityIndicator size={20} color={black}/>
              :
              <Text style={{color: black,fontWeight: 'bold'}}>Enviar</Text>
          }
        </TouchableOpacity>

        }


    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: grey,
    borderWidth: 1,
    borderRadius: 10,
    width: '90%',
    textAlign: 'center',
    marginTop: 3
  }
})


