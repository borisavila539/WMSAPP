import React, { FC, useEffect, useState } from 'react'
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import Header from '../components/Header'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParams } from '../navigation/navigation'
import { ScreensInterface } from '../interfaces/ScreeensInterface'
import { navy } from '../constants/Colors'

type props = StackScreenProps<RootStackParams, "TelaOptionScreen">

export const TelaoptionScreen : FC<props> = ({ navigation }) => {
  const [data, setData] = useState<ScreensInterface[]>([])

    const setScreens = () => {
        let tmp: ScreensInterface[] = [
            { Name: 'Picking', Screen: 'TelaPickingScreen', image: require('../assets/Picking.png') },
            { Name: 'Packing', Screen: 'CamionChoferScreen', image: require('../assets/Packing.png') },
            { Name: 'Recibir', Screen: 'TelaReceiveScreen', image: require('../assets/Recibir.png') },

        ]
        setData(tmp)
    }

    const renderItem = (item: ScreensInterface) => {
      return (
          <View style={{ width: '50%', alignItems: 'center' }}>
              <View style={{ width: '95%', borderWidth: 1, alignItems: 'center', borderRadius: 15, paddingVertical: 5, marginTop: 5 }}>
                  <TouchableOpacity onPress={() => navigation.navigate(item.Screen)}>
                      <Image
                          source={item.image}
                          style={{ width: 100, height: 100, resizeMode: 'contain' }}
                      />
                      <Text style={{ color: navy, textAlign: 'center' }}>{item.Name}</Text>
                  </TouchableOpacity>
              </View>
          </View>
      )
  }

  useEffect(()=>{
    setScreens();
  },[])
  return (
    <View style={{flex:1, width:'100%'}}>
        <Header texto1=''  texto2='Tela' texto3=''/>
        <FlatList
                data={data}
                keyExtractor={(item) => item.Screen.toString()}
                renderItem={({ item, index }) => renderItem(item)}
                showsVerticalScrollIndicator={false}
                numColumns={2}
            />
    </View>
  )
}
