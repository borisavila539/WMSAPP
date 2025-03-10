import { StyleSheet } from "react-native";
import { grey, orange } from "../../../constants/Colors";

export const ReceptionTelaDetalleStyle = StyleSheet.create({
    item: {
      padding: 20,
      margin: 10,
      borderRadius: 10,
      flex: 1
    },
    left: {
      marginRight: 5,
      backgroundColor: orange
    },
    right: {
      marginLeft: 5
    },
    input: {
      backgroundColor: grey,
      borderWidth: 1,
      borderRadius: 10,
      width: '90%',
      textAlign: 'center',
      marginTop: 3
    }
  });