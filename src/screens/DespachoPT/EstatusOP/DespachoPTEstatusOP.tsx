
import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, FlatList, TextInput, StyleSheet } from 'react-native'
import { RootStackParams } from '../../../navigation/navigation'
import Header from '../../../components/Header'
import { grey, orange } from '../../../constants/Colors'
import { EstatusOPPTInterface } from '../../../interfaces/DespachoPT/EstatusOP/GetEstatusOP'
import { WmSApi } from '../../../api/WMSApi'
type props = StackScreenProps<RootStackParams, "DespachoPTEstatusOP">

export const DespachoPTEstatusOP: FC<props> = ({ navigation }) => {
  const [cargando, setCargando] = useState<boolean>(false)
  const [data, setData] = useState<EstatusOPPTInterface[]>([])

  const getData = async () => {
    if (!cargando) {
      setCargando(true)
      try {
        await WmSApi.get<EstatusOPPTInterface[]>('EstatusOP_PT/20').then(resp => { //colcoar el almacen del usuario
          setData(resp.data)
          console.log(resp.data)
        })
      } catch (err) {

      }
      setCargando(false)
    }

  }

  const renderItem = (item: EstatusOPPTInterface, index: number) => {
    return (
      <View style={styles.container}>
        <View style={styles.card}>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold' }}>{item.prodcutsheetid}</Text>
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
            />
            :
            <ActivityIndicator color={orange} />
        }
      </View>
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
  }

})

