import React, { useState, useEffect, useCallback, cloneElement } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import { StyleSheet, Alert } from 'react-native';
import {
  connect,
  createGroup,
  receiveMessage,
  sendMessage,
  getConnectionInfo,
} from 'react-native-wifi-p2p';
import { CONNECTED } from 'react-native-wifi-p2p/device-info-statuses';
import { NetworkInfo } from 'react-native-network-info';

/*
 1. Create group on server side (side, which will receive message)
 2. Connect to server-group from client side
 3. After establishing connection you should call getConnectionInfo() on client side (also recommend do it on group-server side)
 4. Call receiveMessage() on server side (receiveMessage return Promise<string> - message from client)
 5. Call sendMessage(message) on client side, after resolving getConnectionInfo()
*/

var net = require('react-native-tcp');

const PORT = 6000

const IP = '192.168.49.1'

export default function NearbyChat({ route }) {

  const [messages, setMessages] = useState([]);
  const { isOwner, deviceAddress } = route.params;

  let server, client, socketRef;
  let receiveInterval, connectionInterval;

  useEffect(() => {

    // Fetching connection info after every 300 ms
    connectionInterval = setInterval(() => {
      onGetConnectionInfo();
    }, 300);

    if (isOwner) {
      // SERVER SIDE

      // create the group
      console.log("[INFO] Creating the group...")
      onCreateGroup();

      /*
        Now the client will connect with the group
        After that the server will start receiving messages
        so call onReceiveMessage

        Recommended step is to call getConnectionInfo here at the server side after 
        connected gets established with the client
      
        Now the connection is established between the client
        and the server. Create a socket at the Client IP Address
      */

      // Now adding setInterval to automatically receive messages
      receiveInterval = setInterval(() => onReceiveMessage(), 100)
    }
    else {
      // CLIENT SIDE

      // Connect to the group created by the server
      connect(deviceAddress)
        .then(info => {
          console.log("[INFO] Client connected to the group", info);
        })
        .catch(err => console.log('[FATAL] Unable to connect with the server group'));

      getConnectionInfo().then(info => {
        console.log('[GET CONNECTION INFO]', info);
      })

      console.log('[SENDING] Connection Message to the server');

      setTimeout(() => {
        console.log("Sending Message...")
        // After connecting to the group, call sendMessage function
        sendMessage("[INFO] Connection got establised !")
          .then(metaInfo => console.log("[INFO] Message from client -> server", metaInfo))
          .catch(err => console.log("[ERROR] Error sending message from client -> server"))
      }, 6000);

      /*
        Hacky setup to receive messages from the server

        This work as follows:
          - [x] Client IP is sent to the server
          - [x] Server socket is created at the client IP
          - Client will join the connection socket of server
          - Server will send message, which client will listen on
      */
      console.log('[CONNECTED] ------> ', CONNECTED);
      setTimeout(() => {

        let s = net.createServer(socket => {
          socket.write("hello from server");

          socket.on('data', (data) => console.log(data));

          socket.on('error', (err) => console.log(err))
        }).listen(PORT, IP);

        s.on('error', (err) => console.log(err));

        let c = net.createConnection(PORT, IP, () => {
          client.write("Love from client");
        });

        c.on('data', (data) => {
          console.log(data);
        })

        c.on('error', (err) => {
          console.log(err);
        })
      }, 10000);
    }

    return (() => {
      clearInterval(receiveInterval);
      clearInterval(connectionInterval);
    })
  }, []);

  const onCreateGroup = () => {
    createGroup()
      .then(() => console.log('Group created successfully!'))
      .catch(err => console.error('Something gone wrong. Details: ', err));
  };

  const onGetConnectionInfo = () => {
    getConnectionInfo()
      .then(info => { });
  };

  const onReceiveMessage = () => {
      receiveMessage()
        .then(message => {
          const msg = [{
            _id: Math.random(1000).toString(), // random key
            text: message,
            createdAt: new Date(),
            user: {
              _id: 2,
            },
          }];
          setMessages(previousMessages => GiftedChat.append(previousMessages, msg))
        })
        .catch(err => console.log("[FATAL] Unable to receive messages"))
  };


  const onSendMessage = useCallback((message = []) => {
    /*
      If server is sending the message, this has to be done using server.write method
  
      If client is sending this can be done by sendMessage method of the react-native-wifi-p2p
    */
    if (isOwner) {
      // SERVER [TODO]
      // server.current.socket.write(message)
    }
    else {
      // CLIENT
      setMessages(previousMessages => GiftedChat.append(previousMessages, message));
      sendMessage(messages[messages.length - 1].text)
        .then((metaInfo) => console.log('[INFO] Send client message successfully', metaInfo))
        .catch(err => console.log('[FATAL] Unable to send client message'));
    }
  }, []);

  return (
    <GiftedChat
      messages={messages}
      onSend={messages => onSendMessage(messages)}
      user={{
        _id: 1,
      }}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
  },

  textHeader: {
    fontFamily: "sans-serif",
    fontSize: 22,
    alignSelf: "center",
    marginTop: 20,
  }
})