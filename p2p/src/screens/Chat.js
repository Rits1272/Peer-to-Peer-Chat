import React, {useState, useRef, useEffect, useCallback} from 'react';
import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc'
import { GiftedChat } from 'react-native-gifted-chat';
import io from "socket.io-client";

import { Text, View, StyleSheet, TextInput, Button } from 'react-native';

const Chat = ({ route }) => {
  const peerRef = useRef();
  const socketRef = useRef();
  const otherUser = useRef();
  const sendChannel = useRef();
  const { roomID } = route.params;
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socketRef.current = io.connect("http://192.168.1.9:9000");
    socketRef.current.emit("join room", roomID); // Provide Room ID here

    socketRef.current.on("other user", userID => {
      callUser(userID);
      otherUser.current = userID;
    });

    socketRef.current.on("user joined", userID => {
      otherUser.current = userID;
    });

    socketRef.current.on("offer", handleOffer);
    
    socketRef.current.on("answer", handleAnswer);

    socketRef.current.on("ice-candidate", handleNewICECandidateMsg);

  }, []);

  function callUser(userID){
    // This will initiate the call
    console.log("[INFO] Initiated a call")
    peerRef.current = Peer(userID);
    sendChannel.current = peerRef.current.createDataChannel("sendChannel");
    
    // listen to incoming messages
    sendChannel.current.onmessage = handleReceiveMessage;
  }

  function Peer(userID) {
    const peer = new RTCPeerConnection({
      iceServers: [
          {
              urls: "stun:stun.stunprotocol.org"
          },
          {
              urls: 'turn:numb.viagenie.ca',
              credential: 'muazkh',
              username: 'webrtc@live.com'
          },
         ]
      });
    peer.onicecandidate = handleICECandidateEvent;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

    return peer;
  }

  function handleNegotiationNeededEvent(userID){
    // Make Offer
    peerRef.current.createOffer().then(offer => {
       return peerRef.current.setLocalDescription(offer);
    })
    .then(() => {
      const payload = {
        target: userID,
        caller: socketRef.current.id,
        sdp: peerRef.current.localDescription,
      };
      socketRef.current.emit("offer", payload);
    })
    .catch(err => console.log("Error handling negotiation needed event", err));
  }

  function handleOffer(incoming) {
    // Handle Offer made by the initiating peer
    console.log("[INFO] Handling Offer")
    peerRef.current = Peer();
    peerRef.current.ondatachannel = (event) => {
      sendChannel.current = event.channel;
      sendChannel.current.onmessage = handleReceiveMessage;
      console.log('[SUCCESS] Connection established')
    }

    const desc = new RTCSessionDescription(incoming.sdp);
    peerRef.current.setRemoteDescription(desc).then(() => {
    }).then(() => {
      return peerRef.current.createAnswer();
    }).then(answer => {
      return peerRef.current.setLocalDescription(answer);
    }).then(() => {
      const payload = {
        target: incoming.caller,
        caller: socketRef.current.id,
        sdp: peerRef.current.localDescription
      }
      socketRef.current.emit("answer", payload);
    })
  }

  function handleAnswer(message){
    // Handle answer by the remote peer
    const desc = new RTCSessionDescription(message.sdp);
    peerRef.current.setRemoteDescription(desc).catch(e => console.log("Error handle answer", e));
  }

  
  function handleReceiveMessage(e){
    console.log("[INFO] Message received from peer", e.data);
    const msg = [{
      _id: Math.random(1000).toString(),
      text: e.data,
      createdAt: new Date(),
      user: {
        _id: 2,
      },
    }];
    setMessages(previousMessages => GiftedChat.append(previousMessages, msg))
    // setMessages(messages => [...messages, {yours: false, value: e.data}]);
  };

  function handleICECandidateEvent(e) {
    if (e.candidate) {
        const payload = {
            target: otherUser.current,
            candidate: e.candidate,
        }
        socketRef.current.emit("ice-candidate", payload);
    }
}

function handleNewICECandidateMsg(incoming) {
  const candidate = new RTCIceCandidate(incoming);

  peerRef.current.addIceCandidate(candidate)
      .catch(e => console.log(e));
}

function sendMessage(messages = []){
  console.log(messages);
  sendChannel.current.send(messages[0].text);
  setMessages(previousMessages => GiftedChat.append(previousMessages, messages))
}

// console.log(messages);
  return (
    <GiftedChat
      messages = {messages}
      onSend = {messages => sendMessage(messages)}
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

export default Chat;