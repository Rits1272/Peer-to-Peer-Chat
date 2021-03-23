import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Button,
  ScrollView,
  Text,
} from 'react-native';
import {
  initialize,
  startDiscoveringPeers,
  stopDiscoveringPeers,
  unsubscribeFromPeersUpdates,
  unsubscribeFromThisDeviceChanged,
  unsubscribeFromConnectionInfoUpdates,
  subscribeOnConnectionInfoUpdates,
  subscribeOnThisDeviceChanged,
  subscribeOnPeersUpdates,
  cancelConnect,
  createGroup,
  removeGroup,
  getAvailablePeers,
  getConnectionInfo,
  getGroupInfo,
} from 'react-native-wifi-p2p';
import { PermissionsAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';


export default function NearbyMessages() {

  const [devices, setDevices] = useState([]);
  const [data, setData] = useState([]);
  const navigation = useNavigation();

  useEffect(async () => {
    try {
      await initialize();
      // since it's required in Android >= 6.0
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          'title': 'Access to wi-fi P2P mode',
          'message': 'ACCESS_FINE_LOCATION'
        }
      );

      console.log(granted === PermissionsAndroid.RESULTS.GRANTED ? "You can use the p2p mode" : "Permission denied: p2p mode will not work");

      subscribeOnPeersUpdates(handleNewPeers);
      subscribeOnConnectionInfoUpdates(handleNewInfo);
      subscribeOnThisDeviceChanged(handleThisDeviceChanged);

      const status = await startDiscoveringPeers();
      console.log('startDiscoveringPeers status: ', status);
    } catch (e) {
      console.error(e);
    }

    return (() => {
      unsubscribeFromConnectionInfoUpdates(handleNewInfo);
      unsubscribeFromPeersUpdates(handleNewPeers);
      unsubscribeFromThisDeviceChanged(handleThisDeviceChanged)
    });
  });

  handleNewInfo = (info) => {
    // console.log('OnConnectionInfoUpdated', info);
  };

  handleNewPeers = ({ devices }) => {
    // console.log('OnPeersUpdated', devices);
    setDevices(devices);
  };

  handleThisDeviceChanged = (groupInfo) => {
    // console.log('THIS_DEVICE_CHANGED_ACTION', groupInfo);
  };

  connectToDevice = (device) => {
    console.log('Connect to: ', device.deviceAddress);
    navigation.navigate('NearbyChat', {isOwner: false, deviceAddress: device.deviceAddress})
  };

  onCancelConnect = () => {
    cancelConnect()
      .then(() => console.log('cancelConnect', 'Connection successfully canceled'))
      .catch(err => console.error('cancelConnect', 'Something gone wrong. Details: ', err));
  };

  onCreateGroup = () => {
    createGroup()
      .then(() => console.log('Group created successfully!'))
      .catch(err => console.error('Something gone wrong. Details: ', err));
  };

  onRemoveGroup = () => {
    removeGroup()
      .then(() => console.log('Currently you don\'t belong to group!'))
      .catch(err => console.error('Something gone wrong. Details: ', err));
  };

  onStopInvestigation = () => {
    stopDiscoveringPeers()
      .then(() => console.log('Stopping of discovering was successful'))
      .catch(err => console.error(`Something is gone wrong. Maybe your WiFi is disabled? Error details`, err));
  };

  onStartInvestigate = () => {
    startDiscoveringPeers()
      .then(status => console.log('startDiscoveringPeers', `Status of discovering peers: ${status}`))
      .catch(err => console.error(`Something is gone wrong. Maybe your WiFi is disabled? Error details: ${err}`));
  };

  onGetAvailableDevices = () => {
    getAvailablePeers()
      .then(peers => {
        setDevices(peers)
      });
  };

  onGetConnectionInfo = () => {
    getConnectionInfo()
      .then(info => console.log('getConnectionInfo', info));
  };

  onGetGroupInfo = () => {
    getGroupInfo()
      .then(info => console.log('getGroupInfo', info));
  };

  return (
    <ScrollView>
      <Button
        title="Search Peers"
        onPress={onStartInvestigate}
      />
      <Text>Available Devices...</Text>
      {devices !== undefined && devices.map(d => {
        return(
            <Button key={Math.random(1000).toString()} color='red' title={d.deviceName} onPress={() => connectToDevice(d)} />
        );
      })}
      <Button color='green' title='Create Group' onPress={() =>{ navigation.navigate('NearbyChat', {isOwner: true, deviceAddress: ""})}}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});