import Peer from 'peerjs';
import CodeMirror from 'codemirror';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { CodeMirrorBinding } from 'y-codemirror';
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/mode/css/css.js';
import 'codemirror/mode/python/python.js';
import 'codemirror/mode/rust/rust.js';

const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.setAttribute('id','myVideo');

async function init(){
  const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:false});
  addVideoStream(myVideo,stream);

  function addVideoStream(Video,stream){
    Video.srcObject = stream;
    Video.addEventListener('loadedmetadata',()=>{
      Video.play();
    })
    videoGrid.append(Video);
  }
  let clientId;

  myPeer.on('open',(id)=>{
    const peerInfo = {
      clientId:id,
      roomId:roomID
    }
    axios.post('/peerJs',peerInfo)
    .then((res)=>{
      clientId = res.data;
  
      connectToNewUser(clientId,stream);
    })
  })
  myPeer.on('call',async(call)=>{
    await call.answer(stream)
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
  
}


const currentPath = window.location.pathname;
const roomID = currentPath.slice(-36);

const languageBox = document.getElementById('languageBtn');
const language  = languageBox.innerHTML;

const myPeer = new Peer(undefined,{
  host:'/',
  port:'3001',
});

window.addEventListener('load',()=>{
 

  
  const editorBox = document.getElementById('editor');
  const dwnldBtn = document.getElementById('download');

init();

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
