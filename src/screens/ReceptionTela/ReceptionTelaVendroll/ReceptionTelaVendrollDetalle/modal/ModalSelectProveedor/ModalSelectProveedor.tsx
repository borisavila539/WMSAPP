import { FlatList, Modal, Pressable, View, Text, TouchableHighlight, ActivityIndicator, TextInput, TouchableOpacity } from "react-native";
import { ModalSelectColorStyle } from "./ModalSelectProveedor.style";
import { FC, useEffect, useRef, useState } from "react";
import Icon from 'react-native-vector-icons/FontAwesome5';
import { black } from "../../../../../../constants/Colors";
import { ListaProveedores } from "../../../ReceptionTelaVendroll.types";
import { ReceptionTelaVendrollService } from "../../../ReceptionTelaVendrollService";
import { ReceptionTelaDetalleStyle } from "../../../../ReceptionTelaDiario/ReceptionTelaDetalle/ReceptionTelaDetalle.style";

interface ModalSelectProveedorProps {
  isOpenModal: boolean;
  onClose: (value: ListaProveedores | null) => void;
}

export const ModalSelectProveedor: FC<ModalSelectProveedorProps> = ({ isOpenModal, onClose }) => {

  const receptionTelaVendrollService = new ReceptionTelaVendrollService();

  const [modalVisible, setModalVisible] = useState(false);
  const [proveedores, setProveedores] = useState<ListaProveedores[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nameProveedor, setNameProveedor] = useState('');

  //Refs
  const nameProveedorInputRef = useRef<TextInput>(null);

  useEffect(() => {
    setModalVisible(isOpenModal);
  }, [isOpenModal]);

  useEffect(() => {
    getData();
  }, []);

  const getData = (searchValue:string = '') =>{
    setIsLoading(true);
    setProveedores([])
    receptionTelaVendrollService.getListaProveedores(searchValue)
      .then((data) => {
        setProveedores(data);
        setIsLoading(false);

      })
      .catch(() => {
        setProveedores([]);
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
      <View style={ModalSelectColorStyle.centeredView}>
        <View style={ModalSelectColorStyle.modalView}>
          <View style={ModalSelectColorStyle.modalHeader} >
            <Text style={{ fontSize: 16, fontWeight: '700' }} > Proveedores</Text>
            <Pressable
              onPress={() => { onClose(null) }}>
              <Icon name='times' size={18} color={black} />
            </Pressable>
          </View>



          <View style={[ReceptionTelaDetalleStyle.input, { width: '100%', borderColor: black, borderWidth: 2, flexDirection: 'row', marginBottom: 5, alignItems: 'center' }]} >

            <TextInput
              ref={nameProveedorInputRef}
              placeholder='Nombre del proveedor'
              onSubmitEditing={() => {
                nameProveedorInputRef.current?.focus();
              }}
              style={[ReceptionTelaDetalleStyle.input, { width: '90%', borderWidth: 0 }]}
              onChangeText={(value) => {
                setNameProveedor(value);
              }}
              value={nameProveedor}
            />

            {
              isLoading ?
                <ActivityIndicator size={20} />
                :
                <TouchableOpacity onPress={() => { getData(nameProveedor) }}>
                  <Icon name='search' size={15} color={black} />
                </TouchableOpacity>
            }
          </View>
          <FlatList
            data={proveedores}
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
              >{item.item.name}</Text>
            </TouchableHighlight>}
            ListEmptyComponent={() => (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
                {isLoading == false && <Text >No se encontraron proveedores.</Text>}
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  )
}