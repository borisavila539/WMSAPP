
import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, FlatList, TextInput, StyleSheet, TouchableOpacity } from 'react-native'
import { RootStackParams } from '../../../navigation/navigation'
import Header from '../../../components/Header'
import { grey, orange } from '../../../constants/Colors'
import { EstatusOPPTInterface, EstatusOPPTSendInterface } from '../../../interfaces/DespachoPT/EstatusOP/GetEstatusOP';
import { WmSApi } from '../../../api/WMSApi'
import { WMSContext, WMSState } from '../../../context/WMSContext';
import MyAlert from '../../../components/MyAlert'
import { convert } from 'react-native-html-to-pdf'
type props = StackScreenProps<RootStackParams, "DespachoPTEstatusOP">

export const DespachoPTEstatusOP: FC<props> = ({ navigation }) => {
  const [cargando, setCargando] = useState<boolean>(false)
  const [data, setData] = useState<EstatusOPPTInterface[]>([])
  const { WMSState } = useContext(WMSContext)
  const [enviando, setEnviando] = useState<boolean>(false)
  const [indexEnviando, setindexEnviando] = useState<number>(-1)
  const [showMensajeAlerta, setShowMensajeAlerta] = useState<boolean>(false);
  const [tipoMensaje, setTipoMensaje] = useState<boolean>(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<string>('');

  const getData = async () => {
    if (!cargando) {
      setCargando(true)
      try {
        await WmSApi.get<EstatusOPPTInterface[]>(`EstatusOP_PT/${WMSState.usuarioAlmacen}`).then(resp => { //colcoar el almacen del usuario
          setData(resp.data)
          //console.log(resp.data)
        })
      } catch (err) {

      }
      setCargando(false)
    }

  }

  const enviarDiferencias = async (item: EstatusOPPTInterface, index: number) => {
    setindexEnviando(index)
    setEnviando(true)
    console.log(item)
    try {
      let tmp: EstatusOPPTSendInterface = {
        id: 0,
        prodID: item.prodid,
        size: item.size,
        costura1: parseInt((item.Costura1 != null && item.Costura1 != '') ? item.Costura1 : '0'),
        textil1: parseInt((item.Textil1 != null && item.Textil1 != '') ? item.Textil1 : '0'),
        costura2: parseInt((item.Costura2 != null && item.Costura2 != '') ? item.Costura2 : '0'),
        textil2: parseInt((item.Textil2 != null && item.Textil2 != '') ? item.Textil2 : '0'),
        usuario: WMSState.usuario
      }
      if (tmp.costura1 + tmp.costura2 + tmp.textil1 + tmp.textil2 == item.cortado - item.escaneado) {
        await WmSApi.post<EstatusOPPTSendInterface>('Insert_Estatus_Unidades_OP', tmp).then(resp => {
          if (resp.data.id > 0) {
            getData()

          } else {
            setMensajeAlerta('Error al enviar datos')
            setTipoMensaje(false);
            setShowMensajeAlerta(true);
          }
        })
      } else {
        setMensajeAlerta('Faltan unidades')
        setTipoMensaje(false);
        setShowMensajeAlerta(true);
      }



    } catch (err) {
      console.log(err)
      setMensajeAlerta('Error al enviar datos c')
      setTipoMensaje(false);
      setShowMensajeAlerta(true);
    }

    setindexEnviando(-1)
    setEnviando(false)
  }

  const renderItem = (item: EstatusOPPTInterface, index: number) => {
    return (
      <View style={styles.container}>
        <View style={styles.card}>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold' }}>{item.prodcutsheetid} {item.size}</Text>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <View style={styles.textCenter}>
              <Text>Cortadas</Text>
            </View>
            <View style={styles.textCenter}>
              <Text>Escaneadas</Text>
            </View>
            <View style={styles.textCenter}>
              <Text>Diferencia</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <View style={styles.textCenter}>
              <Text>{item.cortado}</Text>
            </View>
            <View style={styles.textCenter}>
              <Text>{item.escaneado}</Text>
            </View>
            <View style={styles.textCenter}>
              <Text>{item.cortado - item.escaneado}</Text>
            </View>
          </View>

          <View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold' }}>Irregulares</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={styles.textCenter}>
                <Text>Costura1</Text>
              </View>
              <View style={styles.textCenter}>
                <Text>Textil1</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={styles.textInput}>
                <TextInput keyboardType='decimal-pad' value={item.Costura1}
                  onChangeText={(value: string) => {
                    const nuevoData = [...data];
                    nuevoData[index].Costura1 = value;
                    setData(nuevoData)
                  }}
                  style={styles.alignText} />
              </View>
              <View style={styles.textInput}>
                <TextInput keyboardType='decimal-pad' value={item.Textil1}
                  onChangeText={(value: string) => {
                    const nuevoData = [...data];
                    nuevoData[index].Textil1 = value;
                    setData(nuevoData)
                  }}
                  style={styles.alignText} />
              </View>
            </View>
          </View>

          <View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold' }}>Terceras</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={styles.textCenter}>
                <Text>Costura2</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text>Textil2</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={styles.textInput}>
                <TextInput keyboardType='decimal-pad' value={item.Costura2}
                  onChangeText={(value: string) => {
                    const nuevoData = [...data];
                    nuevoData[index].Costura2 = value;
                    setData(nuevoData)
                  }}
                  style={styles.alignText} />
              </View>
              <View style={styles.textInput}>
                <TextInput keyboardType='decimal-pad' value={item.Textil2}
                  onChangeText={(value: string) => {
                    const nuevoData = [...data];
                    nuevoData[index].Textil2 = value;
                    setData(nuevoData)
                  }}
                  style={styles.alignText} />
              </View>
            </View>
          </View>
          <View style={styles.containerButton}>
            <TouchableOpacity style={{ width: '100%', alignItems: 'center' }} disabled={enviando} onPress={() => enviarDiferencias(item, index)}>
              {

                index != indexEnviando ?
                  <Text style={[styles.textCenter, { color: grey }]}>Enviar</Text> :
                  <ActivityIndicator color={grey} />
              }
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
    <View style={{ flex: 1, width: '100%', backgroundColor: grey }}>
      <Header texto1='' texto2='Despacho PT Estatus OP' texto3='' />
      <View style={{ flex: 1, width: '100%', borderWidth: 1 }}>
        {
          !cargando ?
            <FlatList
              data={data}
              keyExtractor={(item) => item.prodid.toString()}
              renderItem={({ item, index }) => renderItem(item, index)}
              ListEmptyComponent={() => {
                return (
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.textCenter}>No hay orden con diferencia</Text>
                  </View>
                )
              }}
            />
            :
            <ActivityIndicator color={orange} />
        }
      </View>
      <MyAlert visible={showMensajeAlerta} tipoMensaje={tipoMensaje} mensajeAlerta={mensajeAlerta} onPress={() => setShowMensajeAlerta(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 5
  },
  card: {
    width: '95%',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 5,
    padding: 5
  },
  textCenter: {
    flex: 1,
    alignItems: 'center'
  },
  textInput: {
    borderWidth: 1,
    flex: 1,
    borderRadius: 10,
    marginRight: 2
  },
  alignText: {
    textAlign: 'center'
  },
  containerButton: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: orange,
    borderRadius: 10,
    padding: 5,
  }
})

