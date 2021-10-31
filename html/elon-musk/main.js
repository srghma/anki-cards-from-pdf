const googleTTS = require('google-tts-api')

function isHanzi(ch) {
  const REGEX_JAPANESE = /[\u3000-\u303f]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uff9f]|[\u4e00-\u9faf]|[\u3400-\u4dbf]/
  const REGEX_CHINESE = /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u;

  const isSpecialChar = "。？！".includes(ch)
  const isJapanese = REGEX_JAPANESE.test(ch)
  const isChinese = REGEX_CHINESE.test(ch)
  const isHanzi = !isSpecialChar && (isJapanese || isChinese)

  return isHanzi
}

const getCurrentSentenceTextContent = () => document.getElementById('currentSentence').textContent

const playTTS = (url) => {
   // audioEl.play();
};

const setAudio = text => {
  const url = googleTTS.getAudioUrl(text, {
    lang: 'zh',
    slow: true,
  });

  const audioEl = document.getElementById('tts-audio')
  if (audioEl.src !== url) {
    audioEl.src = url
    audioEl.load()
  }
}


function _canvasPenJS(canvas,rgba,w,plot){
  //============================================================================
  var slf=window,cvs=slf.document.getElementById(canvas.id),I=0,n=0,c,x=0,y=0,Rect,
      evnt=[
        ['mousedown','mouseup','mousemove','mouseout'],
        ['mouseup'],
        ['touchstart','touchmove','touchend']
      ];
  //relative position of the canvas to the viewport
  Rect=!!cvs.getBoundingClientRect()?cvs.getBoundingClientRect():{top:0,left:0};
  /* --- Reference ---
  * -"MDN: Element.getBoundingClientRect()" derived on 2016-12-28 and from:
  * https://developer.mozilla.org/en/docs/Web/API/Element/getBoundingClientRect
  */
  //============================================================================
  //== <Handling clicks with touch event> ==
//this function simulates mouse event via touch event.
function touch2MouseEvt(e){
  //e is event object
  e.preventDefault();
  if(!!e.changedTouches&&e.changedTouches.length>0){
    var touch0=e.changedTouches[0],
        /*function simulates new mouse event*/
        newMEvt=function(EventName,tObj,tgt){
          //tObj and tgt are touch object and target element
          var E=new MouseEvent(EventName,{
            'view':window,
            'bubbles':true,
            'cancelable':true,
            'clientX':tObj.clientX,
            'clientY':tObj.clientY
          });
          tgt.dispatchEvent(E);
        };
    switch(e.type){
      case 'touchstart':
        newMEvt('mousedown',touch0,e.target);
        break;
      case 'touchmove':
        newMEvt('mousemove',touch0,e.target);
        break;
      case 'touchend':
        newMEvt('mouseup',touch0,e.target);
        break;
    }
  }else{return;}
}
  //== </Handling clicks with touch event> ==
  var dr=function(e){
    //e: event, dr.d[0]=flag:true|false, dr.d[1]=x0, dr.d[2]=y0
    if(!dr.d){dr.d=[false,0,0];}
    var D=dr.d;
    /*Event: mousedown*/
    if(!(e.type!='mousedown')){
      D[0]=true,D[1]=e.clientX-Rect.left,D[2]=e.clientY-Rect.top;
    }
    /*Event: mouseup*/
    else if(!(e.type!='mouseup')){
      D[0]=false,x=e.clientX-Rect.left,y=e.clientY-Rect.top;
    }
    /*Event: mousemove|mouseout*/
    else if(!(e.type!='mousemove')||!(e.type!='mouseout')){
      if(D[0]){
        x=e.clientX-Rect.left,y=e.clientY-Rect.top;
        c=cvs.getContext('2d'),c.strokeStyle=rgba,c.lineWidth=w;
        c.beginPath(),c.moveTo(D[1],D[2]),c.lineTo(x,y),c.stroke();
        D[1]=x,D[2]=y;
        //reset strokeStyle and lineWidth
        c.strokeStyle='rgba(0,0,0,1)',c.lineWidth=1;
        if(!(e.type!='mouseout')){
          D[0]=false;
        }
      }
    }
  };
  //============================================================================
  //Handling clicks with touch event
  cvs=slf.document.getElementById(canvas.id),n=evnt[2].length,I=0;
  while(I<n){cvs.addEventListener(evnt[2][I],touch2MouseEvt,true),I+=1;}

  //=== drawing ===
  n=evnt[0].length,I=0;
  while(I<n){cvs.addEventListener(evnt[0][I],dr,true),I+=1;}
  //returned function
  return function(){
    cvs=slf.document.getElementById(canvas.id),I=0;
    while(I<n){cvs.removeEventListener(evnt[0][I],dr,true),I+=1;}
    //reset strokeStyle and lineWidth
    if(!c){c=cvs.getContext('2d');}
    c.strokeStyle='rgba(0,0,0,1)',c.lineWidth=1;
  };
}

////////////

document.addEventListener("DOMContentLoaded", function(){
  document.getElementById("body").addEventListener('click', function(event) {
    event.preventDefault()

    const element = event.target

    if (element.tagName !== 'SENTENCE') { return }

    function addLinks(text) {
      const colorizer = (ch, colorIndex) => `<a target="_blank" href="../h.html#${ch}">${ch}</a>`
      return [...text].map(ch => isHanzi(ch) ? colorizer(ch) : ch).join('')
    }

    document.getElementById('currentSentence').innerHTML = addLinks(element.getAttribute("data-simplified"))
    document.getElementById('currentSentenceTraditional').innerHTML = addLinks(element.getAttribute("data-traditional"))

    setAudio(element.textContent)
  }, false);

  document.getElementById('pleco').addEventListener('click', function(event) {
    event.preventDefault()

    window.open(`plecoapi://x-callback-url/s?q=${encodeURIComponent(getCurrentSentenceTextContent())}`, '_blank')
  }, false);

  //////////////

  _canvasPenJS({ id: "canvas-canvas" },'rgba(255,0,0,1)',2,false)
});
