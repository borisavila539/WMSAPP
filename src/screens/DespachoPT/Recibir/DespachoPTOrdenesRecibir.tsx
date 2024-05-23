import { StackScreenProps } from '@react-navigation/stack'
import React, { FC } from 'react'
import { View } from 'react-native'
import { Text } from 'react-native-elements'
import { RootStackParams } from '../../../navigation/navigation'
import Header from '../../../components/Header'
import { grey } from '../../../constants/Colors'
type props = StackScreenProps<RootStackParams, "DespachoPTOrdenesRecibir">

export const DespachoPTOrdenesRecibir: FC<props> = ({ navigation })  => {
  return (
    <View style={{ flex: 1, width: '100%', backgroundColor: grey }}>
        <Header texto1='' texto2='Despacho PT Recibir' texto3='' />
        <Text>Despacho PT Picking</Text>
    </View>
  )
}

