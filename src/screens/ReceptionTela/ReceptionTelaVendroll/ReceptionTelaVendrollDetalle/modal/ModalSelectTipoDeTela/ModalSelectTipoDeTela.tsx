import { FlatList, Modal, Pressable, View, Text, TouchableHighlight, ActivityIndicator } from "react-native";
import { ModalSelectTipoDeTelaStyle } from "./ModalSelectTipoDeTela.style";
import { FC, useEffect, useState } from "react";
import Icon from 'react-native-vector-icons/FontAwesome5';
import { black } from "../../../../../../constants/Colors";
import { ListaProveedores, TipoDeTela } from "../../../ReceptionTelaVendroll.types";
import { ReceptionTelaVendrollService } from "../../../ReceptionTelaVendrollService";

interface ModalSelectTipoDeTelaProps {
  isOpenModal: boolean;
  onClose: (value: TipoDeTela | null) => void;
  proveedor: ListaProveedores | null;
}

export const ModalSelectTipoDeTela: FC<ModalSelectTipoDeTelaProps> = ({ isOpenModal, onClose, proveedor}) => {

  const receptionTelaVendrollService = new ReceptionTelaVendrollService();

  const [modalVisible, setModalVisible] = useState(false);
  const [tipoDeTela, setTipoDeTela] = useState<TipoDeTela[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setModalVisible(isOpenModal);
  }, [isOpenModal]);

  useEffect(() => {
    getData();
  }, [proveedor]);

  const getData = () => {
    setIsLoading(true);
    setTipoDeTela([])
    receptionTelaVendrollService.GetListaDeTipoDeTela(proveedor ? proveedor.accountnum : null)
      .then((data) => {
        setTipoDeTela(data);
        setIsLoading(false);

      })
      .catch(() => {
        setTipoDeTela([]);
        setIsLoading(false);

      })
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => {
        setModalVisible(false);
      }}>
      <View style={ModalSelectTipoDeTelaStyle.centeredView}>
        <View style={ModalSelectTipoDeTelaStyle.modalView}>
          <View style={ModalSelectTipoDeTelaStyle.modalHeader} >
            <Text style={{ fontSize: 16, fontWeight: '700' }} > Tipos de tela</Text>
            <Pressable
              onPress={() => { onClose(null) }}>
              <Icon name='times' size={18} color={black} />
            </Pressable>
          </View>

          {isLoading && <ActivityIndicator style={{ marginTop: 24 }} size={24} />}

          <FlatList
            data={tipoDeTela}
            renderItem={(item) => <TouchableHighlight
              underlayColor={'#E0E0E0'}
              onPress={() => {
                setModalVisible(false);
                onClose(item.item);
              }}
              style={{ flex: 1, margin: 4, borderRadius: 6, borderWidth: 1 }}
            >
              <Text
                style={{ fontSize: 16, padding: 6 }}
              >{item.item.reference}</Text>
            </TouchableHighlight>}
            ListEmptyComponent={() => (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
                {isLoading == false && <Text> No se encontraron tipos de tela para {proveedor?.name +' - '+ proveedor?.accountnum} .</Text>}
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  )
}