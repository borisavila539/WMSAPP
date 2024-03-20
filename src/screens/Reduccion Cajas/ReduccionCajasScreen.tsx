import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useEffect, useRef, useState } from 'react'
import { RootStackParams } from '../../navigation/navigation'
import { ActivityIndicator, FlatList, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native'
import { Text } from 'react-native-elements'
import Header from '../../components/Header'
import { black, blue, grey, orange } from '../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { WmSApi } from '../../api/WMSApi'
import SoundPlayer from 'react-native-sound-player'
import MyAlert from '../../components/MyAlert'
import { GrupoLineasDiariointerface, LineasDiariointerface } from '../../interfaces/LineasDiarioInterface'
import { RefreshControl } from 'react-native-gesture-handler'
import Printers from '../../components/Printers'

type props = StackScreenProps<RootStackParams, "ReduccionCajasScreen">

export const ReduccionCajasScreen: FC<props> = ({ navigation }) => {
  const [add, setAdd] = useState<boolean>(true);
  const [IMBoxCode, setIMBoxCode] = useState<string>('')
  const textInputRef = useRef<TextInput>(null);
  const [barCode, setbarcode] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);
  const [showMensajeAlerta, setShowMensajeAlerta] = useState<boolean>(false);
  const [tipoMensaje, setTipoMensaje] = useState<boolean>(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<string>('');
  const [Lineas, setLineas] = useState<GrupoLineasDiariointerface[]>([])

  const getData = async () => {
    try {
      await WmSApi.get<LineasDiariointerface[]>(`LineasReduccion/${IMBoxCode}`).then(resp => {
        const groupedData: { [key: string]: LineasDiariointerface[] } = {};

        resp.data.forEach(element => {
          const key = `${element.itemid}-${element.inventcolorid}-${element.imboxcode}`
          if (!groupedData[key]) {
            groupedData[key] = [];
          }
          groupedData[key].push(element);
        });
        const groupedArray: GrupoLineasDiariointerface[] = Object.keys(groupedData).map(key => ({
          key,
          items: groupedData[key],
        }));
        setLineas(groupedArray)
      })
    } catch (err) {

    }
  }
  const AgregarEliminarArticulo = async (PROCESO: string) => {
    if (IMBoxCode == "") {
      setMensajeAlerta("Debe seleccionar una caja")
      setTipoMensaje(false);
      setShowMensajeAlerta(true);
      setbarcode('')
    } else {
      try {
        await WmSApi.get<string>(`InsertDeleteRecuccionCajas/${IMBoxCode}/${barCode}/${PROCESO}`).then(x => {
          if (x.data == 'OK') {
            try {
              SoundPlayer.playSoundFile('success', 'mp3')
            } catch (err) {
              console.log('Sin sonido')
              console.log(err)
            }
            setbarcode('')
            getData();
          } else {
            setbarcode('')
            setMensajeAlerta(x.data.slice(0, 120))
            setTipoMensaje(false);
            setShowMensajeAlerta(true);
            try {
              SoundPlayer.playSoundFile('error', 'mp3')
            } catch (err) {
              console.log('Sin sonido')
              console.log(err)
            }
          }
        })
        setTimeout(() => {
          textInputRef.current?.focus()
        }, 0);
      } catch (err) {
        setbarcode('')
        setMensajeAlerta('Error de envio')
        setTipoMensaje(false);
        setShowMensajeAlerta(true);
      }
    }

  }

  const Giones = (cant: number): string => {
    let texto: string = ''
    while (cant > 0) {
      texto += '_'
      cant--
    }
    return texto
  }

  const getCantidad = (item: LineasDiariointerface[]): number => {
    let suma: number = 0
    item.map(tmp => (
      suma += tmp.qty
    ))
    return suma
  }

  const renderItem = (item: GrupoLineasDiariointerface) => {

    return (
      <View style={style.containerCard} >
        <View style={[style.card,{ backgroundColor: blue }]}>
          <View style={{ width: '80%' }}>
            <Text style={[style.textCard, { fontWeight: 'bold' }]}>{item.items[0].itemid} *{item.items[0].inventcolorid}</Text>

            <View style={{ width: '100%', flexDirection: 'row' }}>
              <Text style={style.textCard}>Talla:</Text>
              {
                item.items.map(subitem => (
                  <View key={subitem.inventsizeid + 'Talla'} style={{ flexDirection: 'row' }}>
                    <Text style={style.textCard}>{Giones(4 - subitem.inventsizeid.length)}</Text>
                    <Text style={style.textCard} >{subitem.inventsizeid}</Text>
                  </View>

                ))
              }
            </View>
            <View style={{ width: '100%', flexDirection: 'row' }}>
              <Text style={style.textCard}>QTY: </Text>
              {
                item.items.map(subitem => (
                  <View key={subitem.inventsizeid + 'QTY'} style={{ flexDirection: 'row' }}>
                    <Text style={style.textCard}>{Giones(4 - subitem.qty.toString().length)}</Text>
                    <Text style={style.textCard} >{subitem.qty}</Text>
                  </View>
                ))
              }
            </View>
          </View>
          <View style={{ width: '19%' }}>
            <Text style={[style.textCard, { textAlign: 'right' }]}>
              {
                getCantidad(item.items)
              }
            </Text>
          </View>
        </View>
      </View>
    )
  }
  const onPress = () =>{
    
  }

  useEffect(() => {
    textInputRef.current?.focus()
  }, [])

  useEffect(() => {
    getData()
  }, [IMBoxCode])

  useEffect(() => {
    if (barCode.slice(0, 2) == "IM") {
      setIMBoxCode(barCode)
      setbarcode('')
      
    } else {
      if (barCode.length == 13 && !cargando && add) {
        AgregarEliminarArticulo('ADD')
      } else if (barCode.length == 13 && !cargando && !add) {
        AgregarEliminarArticulo('REMOVE')
      }
    }
  }, [barCode])

  return (
    <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
      <Header texto1='' texto2='' texto3='' />
      <View style={[style.textInput, { borderColor: add ? '#77D970' : '#CD4439' }]}>
        <Switch value={add} onValueChange={() => setAdd(!add)}
          trackColor={{ false: '#C7C8CC', true: '#C7C8CC' }}
          thumbColor={add ? '#77D970' : '#CD4439'} />

        <TextInput
          ref={textInputRef}
          onChangeText={(value) => { setbarcode(value) }}
          value={barCode}
          style={style.input}
          onBlur={() => textInputRef.current?.focus()}
          placeholder={add ? 'Escanear Ingreso...' : 'Escanear Reduccion...'}

        />
        {!cargando ?
          <TouchableOpacity onPress={() => setbarcode('')}>
            <Icon name='times' size={15} color={black} />
          </TouchableOpacity>
          :
          <ActivityIndicator size={20} />
        }

      </View>

      {
        IMBoxCode != '' &&
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name='box-open' size={30} color={add ? '#77D970' : '#CD4439'} />
          <Text style={{ fontWeight: 'bold', color: add ? '#77D970' : '#CD4439' }}> {IMBoxCode}</Text>
          <TouchableOpacity style={{ backgroundColor: orange, width: '90%', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }} onPress={onPress}>
                <Text style={{ color: grey }}>Imprimir Etiqueta</Text>
            </TouchableOpacity>
        </View>
      }

      {
        Lineas.length > 0 ?
          <FlatList
            data={Lineas}
            keyExtractor={(item, index) => item.key}
            renderItem={({ item, index }) => renderItem(item)}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
            }
            showsVerticalScrollIndicator={false}
          />
          :
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text >No se encontraron articulos en la caja</Text>
          </View>
      }
      <MyAlert visible={showMensajeAlerta} tipoMensaje={tipoMensaje} mensajeAlerta={mensajeAlerta} onPress={() => { setShowMensajeAlerta(false); textInputRef.current?.focus(); }} />

    </View>
  )
}

const style = StyleSheet.create({
  containerCard: {
    width: '100%',
    alignItems: 'center',

  },
  card: {
    maxWidth: 450,
    width: '95%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    borderStyle: 'dashed',
    marginHorizontal: '1%',
    marginVertical: 2,
    flexDirection: 'row',
  },
  textCard: {
    color: grey
  },
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
    width: '75%',
    textAlign: 'center'
  },

})
