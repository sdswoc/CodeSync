import Peer from 'peerjs';
import CodeMirror from 'codemirror';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { CodeMirrorBinding } from 'y-codemirror';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/mode/css/css.js';

const currentPath = window.location.pathname;
const roomID = currentPath.slice(-36);


const data = {
  roomID:roomID
};

const languageBox = document.getElementById('languageBtn');
const language  = languageBox.innerHTML;


const myPeer = new Peer(undefined,{
  host:'/',
  port:'3001',
})



axios.post('/getData',data)
  .then((res)=>{
   const language = res.data.language
  })

window.addEventListener('load',()=>{
  let stream;

  const videoGrid = document.getElementById('video-grid')
  const myVideo = document.createElement('video')
  myVideo.setAttribute('id','myVideo')
  const editorBox = document.getElementById('editor')
  const dwnldBtn = document.getElementById('download')


async function init(){
  stream = await navigator.mediaDevices.getUserMedia({video:true,audio:false})
  addVideoStream(myVideo,stream)
}


function addVideoStream(Video,stream){
  Video.srcObject = stream
  Video.addEventListener('loadedmetadata',()=>{
    Video.play()
  })
  videoGrid.append(Video)
}
init()


let clientId

myPeer.on('open',(id)=>{
  console.log('my client ID:',id)
  const peerInfo = {
    clientId:id,
    roomId:roomID
  }
  axios.post('/peerJs',peerInfo)
  .then((res)=>{
    console.log('others client id sent by server',res.data)
    clientId = res.data;
    console.log("others client ID:",clientId)
    connectToNewUser(clientId,stream);
  })
})


myPeer.on('call',call=>{
  call.answer(stream)
  const video = document.createElement('video')
  video.setAttribute('id','remoteVideo')
  call.on('stream',userVideoStream=>{
    addVideoStream(video,userVideoStream)
  })
})



function connectToNewUser(id,stream){
  const call = myPeer.call(id,stream)
  const video = document.createElement('video')
  call.on('stream',userVideoStream=>{
    addVideoStream(video,userVideoStream)
  })
}

const ydoc = new Y.Doc()
const provider = new WebsocketProvider(
  'ws://localhost:1234',
  roomID,
  ydoc
)



const ytext = ydoc.getText('codemirror')



const editor = CodeMirror(editorBox,{
  mode:language,
  lineNumbers:true,
  theme:'midnight',
})

const binding = new CodeMirrorBinding(ytext,editor,provider.awareness)

dwnldBtn.addEventListener('click',()=>{
  const filename = prompt('File Name?')
  const data = editor.getValue();
  const element = document.createElement('a');
  element.setAttribute('href','data:text/plain; charset=utf-8'+ encodeURIComponent(data));
  element.setAttribute('download',filename);
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element)
})

})
