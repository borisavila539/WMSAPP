import React, { FC } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import { grey, navy } from '../constants/Colors'
import { Text } from 'react-native-elements'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParams } from '../navigation/navigation'

interface HeaderInterface {
    texto1: string,
    texto2: string,
    texto3: string
}

const Header: FC<HeaderInterface> = ({ texto1, texto2,texto3 }) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParams>>();

    const navigateBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack()
        }
    }

    return (
        <View style={style.header}>
            <Pressable onPress={navigateBack} style={{ width: '20%', maxWidth: 50, padding: 5 }}>
                <Icon name='arrow-back-sharp' size={20} color={grey} />
            </Pressable>
            <View style={{ alignContent: 'center' }}>
                <Text style={style.text}>{texto1}</Text>
                <Text style={style.text}>{texto2}</Text>
                <Text style={style.text}>{texto3}</Text>

            </View>
            <View style={{ width: '20%', maxWidth: 50, padding: 5 }}>

            </View>
        </View>
    )
}

const style = StyleSheet.create({
    header: {
        width: '100%',
        height: '15%',
        maxHeight: 60,
        //alignItems: 'center',
        alignContent: 'space-between',
        justifyContent: 'space-between',
        flexDirection: 'row',
        backgroundColor: navy,
        padding: 5,
    },
    text: {
        flex: 3,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: "center",
    }
})

export default Header;
