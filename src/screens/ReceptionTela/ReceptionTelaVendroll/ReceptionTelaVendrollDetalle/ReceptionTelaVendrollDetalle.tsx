import React, { FC, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { RootStackParams } from '../../../../navigation/navigation';
import { StackScreenProps } from '@react-navigation/stack';
import { WMSContext } from '../../../../context/WMSContext';
import Header from '../../../../components/Header';
import { ReceptionTelaVendrollService } from '../ReceptionTelaVendrollService';
import { BodyTelaPickingByVendroll, ListaProveedores, RolloByUUID, TipoDeTela } from '../ReceptionTelaVendroll.types';
import { RefreshControl } from 'react-native-gesture-handler';
import { ReceptionTelaDetalleStyle } from '../../ReceptionTelaDiario/ReceptionTelaDetalle/ReceptionTelaDetalle.style';
import { black, blue, green, orange } from '../../../../constants/Colors';
import Icon from 'react-native-vector-icons/FontAwesome5'
import { ModalSelectProveedor, ModalSelectTipoDeTela } from './modal';
import SoundPlayer from 'react-native-sound-player';

type props = StackScreenProps<RootStackParams, "ReceptionTelaVendrollDetalle">


export const ReceptionTelaVendrollDetalle: FC<props> = () => {

    const receptionTelaVendrollService = new ReceptionTelaVendrollService();

    //Context   
    const { WMSState } = useContext(WMSContext);

    //States
    const [rollosList, setRollosList] = useState<RolloByUUID[]>([]);
    const [bodyTela, setBodyTela] = useState<BodyTelaPickingByVendroll>({
        VendRoll: '',
        ProveedorId: '',
        Location: '',
        CreatedBy: '',
        ActivityUUID: '',
        TelaPickingTypeId: 0,
    });
    const [selectedProveedor, setSelectedProveedor] = useState<ListaProveedores | null>(null);
    const [selectedTipoTela, setSelectedTipoTela] = useState<TipoDeTela | null>(null);

    //Flags
    const [isLoading, setIsLoading] = useState(false);
    const [isSendEmail, setIsSendEmail] = useState(false);
    const [isOpenModalProveedor, setIsOpenModalProveedor] = useState(false);
    const [isOpenModalTela, setIsOpenModalTela] = useState(false);

    //Refs
    const vendRollInputRef = useRef<TextInput>(null);
    const [isFocusedLocation, setIsFocusedLocation] = useState(false);
    const ubicacionInputRef = useRef<TextInput>(null);


    const actualizarCampo = <K extends keyof BodyTelaPickingByVendroll>(
        clave: K,
        valor: BodyTelaPickingByVendroll[K]
    ): void => {
        setBodyTela((prev) => ({
            ...prev!,
            [clave]: valor,
        }));
    };


    const getData = () => {
        setIsLoading(true);
        receptionTelaVendrollService.GetRolloByUUID(WMSState.activityUUID)
            .then((data) => {
                if (data.length >= 1 && selectedProveedor === null && selectedTipoTela === null) {
                    const firstRoll = data[0];
                    setSelectedProveedor({ accountnum: firstRoll.proveedorId, name: firstRoll.nameProveedor });
                    setSelectedTipoTela({ telaPickingTypeId: firstRoll.telaPickingTypeId, reference: firstRoll.reference, description: null, isActive: true });
                }
                setRollosList(data);
                setIsLoading(false);
            })
            .catch((error) => {
                console.log(error);
                setIsLoading(false);
            })
    }

    const PlaySound = (estado: 'success' | 'error' | 'repeat') => {
        try {
            SoundPlayer.playSoundFile(estado, 'mp3')
        } catch (err) {
            console.log(err)
        }
    }

    const postRollo = (vendRoll: string) => {

        if (rollosList.some(x => x.vendRoll === vendRoll)) {
            PlaySound('repeat');
            actualizarCampo('VendRoll', '');
            vendRollInputfocus();

        } else {
            let body = bodyTela;
            body.VendRoll = vendRoll;

            receptionTelaVendrollService.PostTelaPickingByVendroll(body)
                .then((data) => {
                    PlaySound('success');
                    actualizarCampo('VendRoll', '');
                    vendRollInputfocus();

                    if (!isLoading) {
                        getData();
                    }
                })
                .catch(() => {
                    PlaySound('error');
                    actualizarCampo('VendRoll', '');
                    vendRollInputfocus();
                })
        }

    }

    const vendRollInputfocus = () => {
        vendRollInputRef.current?.blur();
        vendRollInputRef.current?.focus();
    }

    const onSendEmail = () => {

        Alert.alert('Confirmar envío de correo',
            `¿Deseas enviar un correo con los ${rollosList.length} rollos escaneados? Esta acción no se puede deshacer.`, [
            {
                text: 'Cancelar',
                style: 'cancel',
            },
            {
                text: 'Enviar', onPress: () => {
                    setIsSendEmail(true);

                    receptionTelaVendrollService.PostCorreoTelaPickingByVendroll(rollosList)
                        .then((data => {
                            setIsSendEmail(false);
                            PlaySound('success');
                        }))
                        .catch(() => {
                            setIsSendEmail(false);
                        })
                }
            },
        ]);


    }

    useEffect(() => {
        if (selectedProveedor) {
            actualizarCampo('ProveedorId', selectedProveedor.accountnum);
        }
        if (selectedTipoTela) {
            actualizarCampo('TelaPickingTypeId', selectedTipoTela.telaPickingTypeId);
        }
    }, [selectedProveedor, selectedTipoTela])

    useEffect(() => {
        getData();
        actualizarCampo('CreatedBy', WMSState.usuario);
        actualizarCampo('ActivityUUID', WMSState.activityUUID);
    }, [])

    const renderItem = (item: RolloByUUID) => {
        return (

            <View style={{ width: '100%', alignItems: 'center', marginBottom: 12 }}>

                <TouchableOpacity
                    style={{ width: '100%', alignItems: 'center', flex: 1 }}
                >
                    <View style={{ width: '96%', borderRadius: 10, padding: 5, backgroundColor: blue }} >
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#fff', fontWeight: '500' }} > {item.vendRoll} </Text>
                        </View>
                        <Text style={{ color: '#fff' }} > {item.nameProveedor} </Text>
                        <Text style={{ color: '#fff' }} > {item.location} </Text>
                        <Text style={{ color: '#fff' }} > {item.reference} </Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }


    return (
        <View style={{ flex: 1, width: '100%', alignItems: 'center' }} >

            <ModalSelectTipoDeTela
                isOpenModal={isOpenModalTela}
                proveedor={selectedProveedor}
                onClose={(event) => {
                    if (event) {
                        setSelectedTipoTela(event);
                        actualizarCampo('TelaPickingTypeId', event.telaPickingTypeId);
                    }
                    setIsOpenModalTela(false);
                }}
            />
            <ModalSelectProveedor
                isOpenModal={isOpenModalProveedor}
                onClose={(event) => {
                    if (event) {
                        setSelectedProveedor(event);
                        actualizarCampo('ProveedorId', event.accountnum);
                    }
                    setIsOpenModalProveedor(false);
                }}
            />
            <Header
                texto1={`Recepcion de Tela por Código`}
                texto2={`${rollosList[0]?.nameProveedor
                    ? rollosList[0].nameProveedor.length > 30
                        ? rollosList[0].nameProveedor.substring(0, 30) + '...'
                        : rollosList[0].nameProveedor
                    : ''
                    }`}
                texto3={` Ubicación: ${rollosList.filter(x=>x.location === bodyTela.Location).length ?? 0} - Rollos: ${rollosList.length}`}
            />
            <View style={{ width: '100%' }} >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, gap: 8 }} >

                    <View style={[ReceptionTelaDetalleStyle.input, { borderColor: isFocusedLocation && bodyTela.Location.length >= 0 ? orange : black, flex: 1, borderWidth: 2, flexDirection: 'row', alignItems: 'center', opacity: bodyTela.Location.length <= 0 ? 0.3 : 1 }]} >

                        <TextInput
                            editable={bodyTela.Location.trim() !== ''}
                            ref={vendRollInputRef}
                            placeholder='Codigo de rollo'
                            maxLength={50}
                            showSoftInputOnFocus={false}
                            onSubmitEditing={() => {
                                vendRollInputRef.current?.focus();
                            }}
                            style={[ReceptionTelaDetalleStyle.input, { width: '90%', borderWidth: 0 }]}
                            onChangeText={(value) => {
                                actualizarCampo('VendRoll', value);
                                postRollo(value);
                            }}
                            value={bodyTela.VendRoll}
                        />

                        {
                            isLoading ?
                                <ActivityIndicator size={20} />
                                :
                                <TouchableOpacity onPress={() => { actualizarCampo('VendRoll', ''); }}>
                                    <Icon name='times' size={15} color={black} />
                                </TouchableOpacity>
                        }
                    </View>

                    <TouchableOpacity

                        onPress={() => { onSendEmail() }}
                        style={{ backgroundColor: (isSendEmail || rollosList.length <= 0) ? green + '80' : green, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginRight: 3, width: '10%' }}
                        disabled={isSendEmail || rollosList.length <= 0}
                    >
                        {
                            isSendEmail ?
                                <ActivityIndicator />
                                :
                                <Icon name='check' size={15} color={black} />
                        }

                    </TouchableOpacity>

                </View>

                <View style={{ flexDirection: 'column', paddingHorizontal: 8, gap: 8, marginBottom: 10 }} >

                    <View style={[ReceptionTelaDetalleStyle.input, { borderColor: bodyTela.Location.length <= 0 && selectedTipoTela !== null ? orange : black, width: '100%', borderWidth: 2, flexDirection: 'row', alignItems: 'center', opacity: selectedTipoTela !== null ? 1 : 0.3 }]} >
                        <TextInput
                            editable={selectedTipoTela !== null}
                            onFocus={() => setIsFocusedLocation(true)}
                            onBlur={() => setIsFocusedLocation(false)}
                            ref={ubicacionInputRef}
                            placeholder='Ubicacion - Rack'
                            onSubmitEditing={() => {
                                vendRollInputRef.current?.focus();
                            }}
                            style={[ReceptionTelaDetalleStyle.input, { width: '100%', borderWidth: 0 }]}
                            onChangeText={(value) => {
                                actualizarCampo('Location', value);
                            }}
                            value={bodyTela.Location}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, width: '100%' }} >
                        <TouchableOpacity
                            disabled={rollosList.length >= 1 || isLoading === true}
                            onPress={() => { setIsOpenModalProveedor(true) }}
                            style={[ReceptionTelaDetalleStyle.input, { overflow: 'hidden', borderColor: black, width: '60%', padding: 8, gap: 6, borderWidth: 2, flexDirection: 'row', alignItems: 'center' }]}
                        >
                            <Icon name='building' size={16} ></Icon>
                            {selectedProveedor ? (
                                <Text style={{ width: '96%' }} numberOfLines={1} >{selectedProveedor.name}</Text>
                            ) : (
                                <Text style={{ opacity: 0.4 }} >Proveedor</Text>
                            )}

                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => { setIsOpenModalTela(true) }}
                            disabled={rollosList.length >= 1 || isLoading === true || !(selectedProveedor !== null)}
                            style={[ReceptionTelaDetalleStyle.input, { borderColor: black, width: '35%', padding: 8, gap: 6, borderWidth: 2, flexDirection: 'row', alignItems: 'center', opacity: isLoading === true || !(selectedProveedor !== null) ? 0.4 : 1 }]}
                        >
                            {selectedTipoTela ? (
                                <Text >{selectedTipoTela.reference}</Text>
                            ) : (
                                <Text style={{ opacity: 0.4 }} >Tipo de tela</Text>
                            )}

                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <FlatList
                style={{ flex: 1, width: '100%' }}
                data={rollosList}
                keyExtractor={(item) => item.telaPickingByVendrollId.toString()}
                renderItem={({ item, index }) => renderItem(item)}
                refreshControl={<RefreshControl refreshing={false} onRefresh={getData} />}
                ListEmptyComponent={() => (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        {isLoading == false && <Text >No se encontraron rollos.</Text>}
                    </View>
                )}
            />
        </View>
    );
};

