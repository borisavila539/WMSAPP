import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { FlatList, RefreshControl, TouchableOpacity, View } from 'react-native'
import { Text } from 'react-native-elements'
import { RootStackParams } from '../../../navigation/navigation'
import Header from '../../../components/Header'
import { blue, grey } from '../../../constants/Colors'
import { DespachosPTInterface } from '../../../interfaces/DespachoPT/Packing/DespachosPTInterface'
import { WmSApi } from '../../../api/WMSApi'
import { WMSContext } from '../../../context/WMSContext'
type props = StackScreenProps<RootStackParams, "DespachoPTOrdenesRecibir">

export const DespachoPTOrdenesRecibir: FC<props> = ({ navigation }) => {
  const [Data, setdata] = useState<DespachosPTInterface[]>([])
  const { changeDespachoID, changeCamion, changeChofer, WMSState } = useContext(WMSContext)

  const getData = async () => {
    try {
      await WmSApi.get<DespachosPTInterface[]>('DespachoPTEstado/Enviado').then(resp => {
        setdata(resp.data)
      })
    } catch (err) {

    }
  }

  const renderItem = (item: DespachosPTInterface) => {
    return (
      <View style={{ width: '100%', alignItems: 'center' }}>
        <View style={{ backgroundColor: grey, width: '95%', borderRadius: 10, margin: 2, padding: 5, borderWidth: 2, borderColor: blue }} >
          <TouchableOpacity style={{ width: '100%' }} onPress={() => {
            changeDespachoID(item.id)
            changeCamion(item.truck)
            changeChofer(item.driver)
            navigation.navigate('DespachoPTRecibir')
          }}>
            <Text>Despacho: {item.id.toString().padStart(8, '0')}</Text>
            <Text>Motorista: {item.driver} / {item.truck}</Text>
            <Text>Fecha: {item.createdDateTime.toString()}</Text>
          </TouchableOpacity>

        </View>
      </View>
    )
  }


  useEffect(() => {
    getData()
  }, [])

  return (
    <View style={{ flex: 1, width: '100%', backgroundColor: grey }}>
      <Header texto1='' texto2='Despacho PT Recibir' texto3='' />
      <FlatList
        data={Data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => renderItem(item)}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
        }
      />
    </View>
  )
}

