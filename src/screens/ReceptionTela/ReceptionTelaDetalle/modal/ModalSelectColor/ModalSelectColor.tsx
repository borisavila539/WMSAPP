import { FlatList, Modal, Pressable, View, Text, TouchableHighlight } from "react-native";
import { ModalSelectColorStyle } from "./ModalSelectColor.style";
import { FC, useEffect, useState } from "react";
import Icon from 'react-native-vector-icons/FontAwesome5';
import { black, blue, grey, orange } from "../../../../../constants/Colors";
import { TelaPickingMerge } from "../../../ReceptionTela.types";

interface ModalSelectColorProps {
  isOpenModal: boolean;
  onClose: (value: TelaPickingMerge | null) => void;
  listColors: TelaPickingMerge[];
  vendRoll: string;
}

export const ModalSelectColor: FC<ModalSelectColorProps> = ({ isOpenModal, onClose, listColors, vendRoll }) => {
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setModalVisible(isOpenModal);
  }, [isOpenModal]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => {
        setModalVisible(false);
      }}>
      <View style={ModalSelectColorStyle.centeredView}>
        <View style={ModalSelectColorStyle.modalView}>
          <View style={ModalSelectColorStyle.modalHeader} >
            <Text style={{ fontSize: 16, fontWeight: '700' }} >PR: {vendRoll}</Text>
            <Pressable
              onPress={() => { onClose(null) }}>
              <Icon name='times' size={18} color={black} />
            </Pressable>
          </View>

          <FlatList

            data={listColors}
            renderItem={(item) =>
              <TouchableHighlight
                underlayColor={'#E0E0E0'}
                onPress={() => {
                  setModalVisible(false);
                  onClose(item.item);
                }}
                style={{flex: 1, margin: 4 }}

              >
                <View style={{ width: '100%', backgroundColor: !item.item.is_scanning ? orange : blue, borderRadius: 10, marginBottom: 5, padding: 5 }}>

                  <Text style={{ fontWeight: 'bold', color: grey, marginBottom: 2 }}>{item.item.inventSerialId}</Text>

                  <Text style={{ color: grey }} >PR: {item.item.vendRoll}</Text>
                  <Text style={{ color: grey }} >Color: {`${item.item.nameColor} (${item.item.inventColorId})`}</Text>
                  <Text style={{ color: grey }} >Qty: {item.item.qty.toFixed(2)}</Text>
                  <Text style={{ color: grey }} >Ubicación: {item.item.location}</Text>

                  {item.item.itemId.startsWith('40') || item.item.itemId.startsWith('45') && <Text style={{ color: grey }} >Tela: {item.item.reference}</Text>}
                  <Text style={{ color: grey }} >{item.item.itemId}</Text>
                  <Text style={{ color: grey }} >{item.item.inventBatchId}</Text>
                  {item.item.descriptionDefecto && <Text style={{ color: grey, borderTopWidth:1, borderColor: '#fff', marginTop: 8 }} >Observación : {item.item.descriptionDefecto}</Text>}


                </View>
              </TouchableHighlight>
            }
          />
        </View>
      </View>
    </Modal>
  )
}