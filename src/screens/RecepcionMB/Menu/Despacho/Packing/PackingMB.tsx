import { StackScreenProps } from '@react-navigation/stack'
import React, { FC } from 'react'
import { RootStackParams } from '../../../../../navigation/navigation'
import { View } from 'react-native'
import Header from '../../../../../components/Header'

type props = StackScreenProps<RootStackParams, "PackingMB">
export const PackingMB: FC<props> = ({ navigation }) => {
  return (
    <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>

            <Header texto1='Packing MB' texto2='' texto3='' />

    </View>
  )
}
