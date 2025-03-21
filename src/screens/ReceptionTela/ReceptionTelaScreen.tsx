import { StackScreenProps } from '@react-navigation/stack'
import React, { FC, useContext, useEffect, useRef, useState } from 'react'
import { RootStackParams } from '../../navigation/navigation'
import { View, Text, FlatList, RefreshControl, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import Header from '../../components/Header'
import { ReceptionTelaService } from './ReceptionTelaService'
import { ListTelas } from './ReceptionTela.types'
import { ReceptionTelaStyle } from './ReceptionTela.style'
import { black, orange } from '../../constants/Colors'
import Icon from 'react-native-vector-icons/FontAwesome5'
import { WMSContext } from '../../context/WMSContext'
import { ProgressBar } from '@react-native-community/progress-bar-android';

type props = StackScreenProps<RootStackParams, "ReceptionTelaScreen">

export const ReceptionTelaScreen: FC<props> = ({ navigation }) => {

  const receptionTelaService = new ReceptionTelaService();

  const { changeTelaJournalId } = useContext(WMSContext);

  const [dataListTelas, setDataListTelas] = useState<ListTelas[]>([]);
  const [journalId, setJournalId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const textInputRef = useRef<TextInput>(null);


  const getData = async () => {
    const searchParam = journalId.length >= 1 ? journalId : '-';
    setIsLoading(true);
    setDataListTelas([]);
    receptionTelaService.getListTelas(searchParam)
      .then(data => {

        setDataListTelas(data);
        setIsLoading(false);
      })
      .catch(()=>{
        setDataListTelas([]);
        setIsLoading(false);
      })
  }


  useEffect(() => {
    getData();
  }, [])

 


  const renderItem = (item: ListTelas) => {
    return (

      <View style={{ width: '100%', alignItems: 'center', marginBottom: 12 }}>
        
        <TouchableOpacity 
        style={{width: '100%', alignItems: 'center'}}
        onPress={() => {
          changeTelaJournalId(item.journalId)
          navigation.navigate('ReceptionTelaDetalle')
        }}
        >
          <View style={{ width: '90%', borderWidth: 1, borderRadius: 10, padding: 5}} >
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#000', fontWeight: '500' }} > {item.journalId} </Text>
              <Text style={{ color: '#000' }} > {item.numOfLinesComplete + '/' + item.numOfLines} </Text>
            </View>

            <Text style={{ color: '#000' }} > {item.description}</Text>

            <View style={{marginTop: item.journalScanCounts.length > 1 ? 14 : 0}} >
                {item.journalScanCounts?.map(scanCount=>(
                  <View key={scanCount.journalid + scanCount.groupByColumn} style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexDirection: 'row', gap: 12}} >
                    <Text style={{fontSize: 12}} >{scanCount.groupByColumn}</Text>
                    <ProgressBar
                            styleAttr='Horizontal'
                            indeterminate={false}
                            progress={scanCount.scannedCount / scanCount.totalCount}
                            style={{ flex: 1 }}
                            color='#6BCB77'
                        />
                    <Text style={{ flex: 1/2, textAlign: 'right'}} >{`${scanCount.scannedCount} / ${scanCount.totalCount}`} </Text>
                  </View>
                ))}
            </View>

          </View>

        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
      <Header texto1='Recepcion de tela' texto2='' texto3='' />

      <View style={[ReceptionTelaStyle.input, { borderColor: journalId != '' ? black : orange, borderWidth: 2, flexDirection: 'row', alignItems: 'center' }]}>
        <TextInput
          ref={textInputRef}
          placeholder='REC-XXXXXX'
          style={[ReceptionTelaStyle.input, { width: '90%', borderWidth: 0 }]}
          onChangeText={(value) => setJournalId(value)}
          value={journalId}
        />

        <TouchableOpacity onPress={getData}>

          <Icon name='search' size={15} color={black} />
        </TouchableOpacity>
      </View>

      {isLoading && <ActivityIndicator style={{marginTop: 24}} size={24} />}

      <View style={{ width: '100%', marginTop: 5, flex: 1 }}>

        <FlatList
          data={dataListTelas}
          keyExtractor={(item) => item.journalId.toString()}
          renderItem={({ item, index }) => renderItem(item)}
          refreshControl={<RefreshControl refreshing={false} onRefresh={getData} />}
          ListEmptyComponent={() => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {isLoading == false && <Text >No se encontraron ordenes</Text>}
            </View>
          )}
        />
      </View>
    </View>
  )
}