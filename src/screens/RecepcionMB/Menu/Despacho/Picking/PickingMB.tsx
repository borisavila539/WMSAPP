import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { RootStackParams } from '../../../../../navigation/navigation'
import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Header from '../../../../../components/Header'
import { DespachoPicking } from '../../../../../interfaces/RecepcionMB/RecepcionMB'
import { WMSApiMB } from '../../../../../api/WMSApiMB'
import { WMSContext } from '../../../../../context/WMSContext'
import { black, blue, grey, navy, orange } from '../../../../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import SoundPlayer from 'react-native-sound-player'

type props = StackScreenProps<RootStackParams, "PickingMB">
export const PickingMB: FC<props> = ({ navigation }) => {
  const [data, setData] = useState<DespachoPicking[]>([])
  const [cargando, setCargando] = useState<boolean>(false)
  const { WMSState } = useContext(WMSContext)
  const textInputRef = useRef<TextInput>(null);
  const [BOXNUM, setBOXNUM] = useState<string>('')

  const getData = async () => {
    if (!cargando) {
      setCargando(true)

      try {
        await WMSApiMB.get<DespachoPicking[]>(`DespachoPicking/${WMSState.DespachoID}`)
          .then(resp => {
            setData(resp.data)
          })
      } catch (err) {

      }
      setCargando(false)
    }
  }

  const renderItem = (item: DespachoPicking) => {

    return (
      <View style={{ width: '100%', alignItems: 'center' }}>
        <View style={{ width: '95%', backgroundColor: !item.picking ? orange : blue, borderRadius: 10, marginBottom: 5, padding: 5 }}>

          <Text style={{ color: grey }}>{item.orden + ',' + item.numeroCaja} </Text>
          <Text style={{ color: grey }}>{item.articulo} </Text>
          <Text style={{ color: grey }}>Lote: {item.lote} </Text>
          <Text style={{ color: grey }}>Talla: {item.talla} </Text>
          <Text style={{ color: grey }}>Color: {item.nombreColor + '(' + item.color + ')'}</Text>
          <Text style={{ color: grey }}>QTY: {item.cantidad} </Text>
          <Text style={{ color: grey }}>Ubicacion: {item.ubicacionRecepcion} </Text>
        </View>
      </View>
    )
  }

  const verificarRollo = async () => {
    try {
      let texto: string[] = BOXNUM.split(',')
      let item: DespachoPicking | undefined = data.find(x => x.orden == texto[0] && x.numeroCaja + '' == texto[1])
      if (item != undefined) {
        if (item.picking == true) {
          PlaySound('repeat')
          setBOXNUM('')
        } else {
          await WMSApiMB.get<DespachoPicking>(`DespachoUpdatePicking/${item.idConsolidado != 0 ? item.idConsolidado : item.id}/${WMSState.usuario}`)
            .then(resp => {
              if (resp.data.picking == true) {
                PlaySound('success')
                setBOXNUM('')
                getData()
              }
            })
        }
      } else {
        PlaySound('error')
        setBOXNUM('')
      }
    } catch (err) {
      PlaySound('error')
      setBOXNUM('')

    }
  }

  const PlaySound = (estado: string) => {
    try {
      SoundPlayer.playSoundFile(estado, 'mp3')
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    getData()
  }, [])

  useEffect(() => {
    if (BOXNUM.length > 0) {
      verificarRollo()
    }
  }, [BOXNUM])
  return (
    <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>

      <Header
        texto1={'Picking MB Despacho:' + WMSState.DespachoID}
        texto2={'Cajas: ' + data.filter(x => x.picking == true && x.idConsolidado == 0).length + '/' + data.filter(x => x.idConsolidado == 0).length}
        texto3={'Etiquetas: ' + data.filter(x => x.picking == true).length + '/' + data.length} />

      <View style={[{
        maxWidth: 450,
        width: '95%',
        backgroundColor: grey,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 5,
        borderWidth: 2, borderColor: '#77D970'
      }]}>
        <TextInput
          ref={textInputRef}
          onChangeText={(value) => { setBOXNUM(value) }}
          value={BOXNUM}
          style={{
            width: '90%',
            textAlign: 'center'
          }}
          placeholder='Escanear...'
          autoFocus
          onBlur={() => textInputRef.current?.focus()}

        />
        {!cargando ?
          <TouchableOpacity onPress={() => setBOXNUM('')}>
            <Icon name='times' size={15} color={black} />
          </TouchableOpacity>
          :
          <ActivityIndicator size={20} />
        }

      </View>

      <View style={{ flexDirection: 'row', flex: 1, width: '100%' }}>

        <View style={{ flex: 1, width: '100%' }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold', color: navy }}>PENDIENTE</Text>


          <FlatList
            data={data.filter(x => x.picking == false)}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => renderItem(item)}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
            } />


        </View>
        <View style={{ flex: 1, width: '100%' }}>

          <Text style={{ textAlign: 'center', fontWeight: 'bold', color: navy }}>REVISADO</Text>

          <FlatList
            data={data.filter(x => x.picking == true)}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => renderItem(item)}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
            }
          />

        </View>

      </View>
    </View>
  )
}
