import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { RootStackParams } from '../navigation/navigation'
import Header from '../components/Header'
import { DespachoTelaDetalleInterface } from '../interfaces/DespachoTelaDetalle'
import { WmSApi } from '../api/WMSApi'
import { black, blue, grey, navy, orange } from '../constants/Colors'

import Icon from 'react-native-vector-icons/FontAwesome5'
import { DespachoPickingpackingInterface } from '../interfaces/DespachoTelaPickingPacking'
import SoundPlayer from 'react-native-sound-player'
import PrintEtiquetaRollo from '../components/PrintEtiquetaRollo';
import { PrinterInterface } from '../interfaces/PrintersInterface';
import { EtiquetaRolloInterface } from '../interfaces/EtiquetaRolloInterface';
import { color } from 'react-native-elements/dist/helpers';
import { WMSContext } from '../context/WMSContext'

type props = StackScreenProps<RootStackParams, "TelaPickingScreen">

export const TelaPickingScreen: FC<props> = ({ navigation }) => {
  const [data, setData] = useState<DespachoTelaDetalleInterface[]>([])
  const [dataPicking, setDataPicking] = useState<DespachoTelaDetalleInterface[]>([])
  const [dataNoPicking, setNoDataPicking] = useState<DespachoTelaDetalleInterface[]>([])
  const textInputRef = useRef<TextInput>(null);
  const [InventSerialID, setinventSerialID] = useState<string>('')
  const [cargando, setCargando] = useState<boolean>(false);
  const [ShowImpresoras, setShowImpresoras] = useState<boolean>(false);
  const [DetalleRollo, setDetalleRollo] = useState<EtiquetaRolloInterface>({ inventserialid: '', apvendroll: '', qtytransfer: '', itemid: '', color: '', inventbatchid: '', configid: '', print: '' })
  const {WMSState} = useContext(WMSContext)


  const getData = async () => {
    setCargando(true)
    try {
      await WmSApi.get<DespachoTelaDetalleInterface[]>(`DespachotelasDetalle/${WMSState.TRANSFERIDFROM}/${WMSState.TRANSFERIDTO}/${WMSState.INVENTLOCATIONIDTO}/PICKING`).then(resp => {
        //DespachotelasDetalle/TRAS-0093249/TRAS-0093610/1/PICKING
        //DespachotelasDetalle/TRAS-0093358/TRAS-0093562/20/PICKING
        let picking: DespachoTelaDetalleInterface[] = [];
        let nopicking: DespachoTelaDetalleInterface[] = [];


        resp.data.map(element => {
          if (element.picking) {
            picking.push(element)
          } else {
            nopicking.push(element)
          }
        })


        setDataPicking(picking)
        setNoDataPicking(nopicking)
        setData(resp.data)
      })
    } catch (err) {
      console.log(`DespachotelasDetalle/${WMSState.TRANSFERIDFROM}/${WMSState.TRANSFERIDTO}/${WMSState.INVENTLOCATIONIDTO}/PICKING`)
      console.log('error de conexion')
    }
    setCargando(false)
  }

  const VerificarRollo = async () => {
    if (data.find(x => x.inventserialid == InventSerialID)?.inventserialid != '') {
      try {
        await WmSApi.get<DespachoPickingpackingInterface[]>(`DespachoTelaPickingPacking/${InventSerialID}/PICKING/-/-/${data.find(x => x.inventserialid == InventSerialID)?.transferid}/${WMSState.usuario}`).then(x => {
          if (x.data.length > 0) {
            if (x.data[0].picking) {
              setinventSerialID('')
              getData()
              PlaySound(true)
            }
          }
          else {
            setinventSerialID('')
            PlaySound(false)
          }
        })

      } catch (err) {
        console.log(err)
      }
    } else {
      PlaySound(false)

    }



  }

  const PlaySound = (estado: boolean) => {
    try {
      SoundPlayer.playSoundFile(estado ? 'success' : 'error', 'mp3')
    } catch (err) {
      console.log('Sin sonido')
      console.log(err)
    }
  }

  const renderItem = (item: DespachoTelaDetalleInterface) => {
    const onPressPrint = () => {
      setDetalleRollo(
        {
          itemid: item.itemid,
          apvendroll: item.apvendroll,
          color: item.bfpitemname,
          configid: item.configid,
          inventbatchid: item.inventbatchid,
          inventserialid: item.inventserialid,
          print: '',
          qtytransfer: item.qtytransfer.toString()
        }
      )
      setShowImpresoras(true)

    }
    return (
      <View style={{ width: '100%', alignItems: 'center' }}>
        <View style={{ width: '95%', backgroundColor: !item.picking ? orange : blue, borderRadius: 10, marginBottom: 5, padding: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <Text style={[style.textRender, { fontWeight: 'bold' }]}>{item.inventserialid}</Text>
            <TouchableOpacity onPress={onPressPrint}>
              <Icon name={'print'} size={25} color={grey} />
            </TouchableOpacity>
          </View>
          <Text style={style.textRender}>PR: {item.apvendroll}</Text>
          <Text style={style.textRender}>Tela: {item.bfpitemname}</Text>
          <Text style={style.textRender}>Color: {item.name} {item.configid.length > 0 ? ' - ' + item.configid : ''}</Text>
          <Text style={style.textRender}>{item.itemid}</Text>
          <Text style={style.textRender}>{item.inventbatchid}</Text>
        </View>
      </View>
    )
  }

  useEffect(() => {
    getData();
  }, [])

  useEffect(() => {
    if (InventSerialID.length > 0) {
      VerificarRollo()
    }

  }, [InventSerialID])


  return (
    <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
      <Header texto2='Picking' texto3={'Revisado: ' + dataPicking.length + '/' + data.length} texto1={WMSState.TRANSFERIDFROM+ '-'+ WMSState.TRANSFERIDTO} />
      <View style={[style.textInput, { borderColor: '#77D970' }]}>
        <TextInput
          ref={textInputRef}
          onChangeText={(value) => { setinventSerialID(value) }}
          value={InventSerialID}
          style={style.input}
          placeholder='Escanear Ingreso...'
          autoFocus
          onBlur={() => textInputRef.current?.focus()}

        />
        {!cargando ?
          <TouchableOpacity onPress={() => setinventSerialID('')}>
            <Icon name='times' size={15} color={black} />
          </TouchableOpacity>
          :
          <ActivityIndicator size={20} />
        }

      </View>
      <View style={{ flexDirection: 'row', flex: 1, width: '100%' }}>

        <View style={{ flex: 1, width: '100%' }}>
          <Text style={{ textAlign: 'center', fontWeight: 'bold', color: navy }}>PENDIENTE</Text>
          {
            dataNoPicking.length > 0 &&
            <FlatList
              data={dataNoPicking}
              keyExtractor={(item) => item.inventserialid.toString()}
              renderItem={({ item, index }) => renderItem(item)}
            />
          }
        </View>
        <View style={{ flex: 1, width: '100%' }}>

          <Text style={{ textAlign: 'center', fontWeight: 'bold', color: navy }}>REVISADO</Text>
          {
            dataPicking.length > 0 &&
            <FlatList
              data={dataPicking}
              keyExtractor={(item) => item.inventserialid.toString()}
              renderItem={({ item, index }) => renderItem(item)}
            />
          }
        </View>


      </View>
      <PrintEtiquetaRollo showImpresoras={ShowImpresoras} onPress={() => setShowImpresoras(false)} data={DetalleRollo} />

    </View>
  )
}

const style = StyleSheet.create({
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
    width: '90%',
    textAlign: 'center'
  },
  textRender: {
    color: grey
  }
})
