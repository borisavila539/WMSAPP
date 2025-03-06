import { StackScreenProps } from '@react-navigation/stack'
import React, { FC } from 'react'
import { RootStackParams } from '../../navigation/navigation'
import { View, Text } from 'react-native'
import Header from '../../components/Header'

type props = StackScreenProps<RootStackParams, "ReceptionTelaScreen">

export const ReceptionTelaScreen:FC<props> = () => {
    return(
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <Header texto1='Recepcion de tela' texto2='' texto3='' />
        </View>
    )
}