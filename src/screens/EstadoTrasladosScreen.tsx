import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { RootStackParams } from '../navigation/navigation'
import { WMSContext } from '../context/WMSContext';
import Header from '../components/Header';
import { EstadoTrasladoInterface } from '../interfaces/EstadotrasladosInterface';
import { WmSApi } from '../api/WMSApi';
import { FlatList, RefreshControl } from 'react-native-gesture-handler';
import { blue, grey, navy, orange } from '../constants/Colors';
import { ProgressBar } from '@react-native-community/progress-bar-android';

type props = StackScreenProps<RootStackParams, "EstadoTrasladoScreen">
export const EstadoTrasladosScreen: FC<props> = ({ navigation }) => {
  const { WMSState } = useContext(WMSContext)
  const [cargando, setCargando] = useState<boolean>(false)
  const [data, setData] = useState<EstadoTrasladoInterface[]>([])
  const [enviado, setEnviado] = useState<number>(0)
  const [recibido, setRecibido] = useState<number>(0)
  const [Total, setTotal] = useState<number>(0)



  const getData = async () => {
    setCargando(true)
    try {
      await WmSApi.get<EstadoTrasladoInterface[]>(`Estadotraslados/${WMSState.TRANSFERIDFROM}/${WMSState.TRANSFERIDTO}/${WMSState.INVENTLOCATIONIDTO}`).then(resp => {
        setData(resp.data)

        let enviar: number = 0
        let recibir: number = 0
        let tot: number = 0

        resp.data.map(element => {
          enviar += element.enviado;
          recibir += element.recibido;
          tot += element.qty;
        })

        setEnviado(enviar)
        setRecibido(recibir)
        setTotal(tot)

      })
    } catch (err) {
      console.log(err)
    }
    setCargando(false)
  }

  const enviarAX = (TRANSFERID: string, estado: string) => {
    console.log(estado + ': ' + TRANSFERID)
  }

  const renderItem = (item: EstadoTrasladoInterface) => {
    const getColor = (num: number, tipo: string): string => {
      if (tipo == 'Enviando' && (item.estado == 'Enviado' || item.estado == 'Recibido')) {
        return '#4D96FF'
      } else if (tipo == 'Recibido' && item.estado == 'Recibido') {
        return '#4D96FF'
      } else if (num == 0) {
        return '#FF6B6B'
      } else if (num > 0 && num < 1) {
        return '#FFD93D'
      } else {
        return '#6BCB77'
      }

    }

    const getColorEstado = (): string => {
      switch (item.estado) {
        case 'Creado':
          return '#FF6B6B'
        case 'Enviado':
          return '#6BCB77'
        case 'Recibido':
          return '#4D96FF'
        default:
          return '#FF6B6B'
      }
    }
    return (
      <View style={{ width: '100%', alignItems: 'center' }}>
        <View style={{ backgroundColor: grey, width: '95%', borderRadius: 10, margin: 2, padding: 5, borderWidth: 1 ,borderColor: getColorEstado()}}>
          <Text style={{ color: navy, textAlign: 'center', fontWeight: 'bold' }}>{item.transferid}</Text>
          <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: navy, width: '30%' }}>Enviado: {item.enviado}/{item.qty}</Text>
            <ProgressBar
              styleAttr='Horizontal'
              indeterminate={false}
              progress={item.enviado / item.qty}
              style={{ width: '40%' }}
              color={getColor(item.enviado / item.qty, 'Enviando')}
            />
            <TouchableOpacity
              onPress={() => getColor(item.enviado / item.qty, 'Enviando') == '#6BCB77' ? enviarAX(item.transferid, 'Enviar') : null}
              style={{ padding: 3, backgroundColor: getColor(item.enviado / item.qty, 'Enviando'), borderRadius: 5, width: '20%', alignItems: 'center' }}>
              <Text style={{ color: grey, fontWeight: 'bold' }}>Enviar</Text>
            </TouchableOpacity>
          </View>
          <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Text style={{ color: navy, width: '30%' }}>Recibido: {item.recibido}/{item.qty}</Text>
            <ProgressBar
              styleAttr='Horizontal'
              indeterminate={false}
              progress={item.recibido / item.qty}
              style={{ width: '40%' }}
              color={getColor(item.recibido / item.qty, 'Recibido')}
            />
            <TouchableOpacity
              onPress={() => getColor(item.recibido / item.qty, 'Recibido') == '#6BCB77' ? enviarAX(item.transferid, 'Reibir') : null}
              style={{ padding: 3, backgroundColor: getColor(item.recibido / item.qty, 'Recibido'), borderRadius: 5, width: '20%', alignItems: 'center' }} >
              <Text style={{ color: grey, fontWeight: 'bold' }}>Recibir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  useEffect(() => {
    getData()
  }, [])
  return (
    <View style={{ flex: 1, width: '100%' }}>
      <Header texto1={WMSState.TRANSFERIDFROM + '-' + WMSState.TRANSFERIDTO} texto2='Estado traslados' texto3='' />
      {Total > 0 &&
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: navy, width: '25%', textAlign: 'center' }}>Enviado:</Text>
          <ProgressBar
            styleAttr='Horizontal'
            indeterminate={false}
            progress={enviado / Total}
            style={{ width: '50%' }}
          />
          <Text style={{ color: navy, width: '25%', textAlign: 'center' }}>{enviado}/{Total}</Text>
        </View>
      }
      {Total > 0 &&
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: navy, width: '25%', textAlign: 'center' }}>Recibido:</Text>
          <ProgressBar
            styleAttr='Horizontal'
            indeterminate={false}
            progress={recibido / Total}
            style={{ width: '50%' }}

          />
          <Text style={{ color: navy, width: '25%', textAlign: 'center' }}>{recibido}/{Total}</Text>
        </View>
      }
      <FlatList
        data={data}
        keyExtractor={(item) => item.transferid.toString()}
        renderItem={({ item, index }) => renderItem(item)}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => getData()} colors={['#069A8E']} />
        }
      />
    </View>
  )
}
