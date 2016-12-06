'use strict';
var dgram = require('dgram');

var debug=false;

var DEFAULT_HOST ;
var DEFAULT_PORT ;
var DEFAULT_REPEATS=3 ;

var PREAMPLE = [0x80,0x00,0x00,0x00,0x11]

var FILLER = 0x00

var CMDS={
 ON: [0x31,0,0,0x08,0x04,0x01,0,0,0],
 OFF: [0x31,0,0,0x08,0x04,0x02,0,0,0],
 NIGHT: [0x31,0,0,0x08,0x04,0x05,0,0,0],
 WHITEON: [0x31,0,0,0x08,0x05,0x64,0,0,0],
 REG: [0x33,0,0,0,0,0,0,0,0,0],
 BON: [0x31,0x00,0x00,0x00,0x03,0x03,0x00,0x00,0x00],
 BOFF:[0x31,0x00,0x00,0x00,0x03,0x04,0x00,0x00,0x00],
 BWHITE:[0x31 ,0x00 ,0x00 ,0x00 ,0x03 ,0x05 ,0x00 ,0x00 ,0x00],
};
var socket;

var zoneCtlRGBWFactory=function(zoneID){
  var color=0x7A;
	var brightness=0x32;
  var saturation=0x32;
  var colorTemp=0x4B;
  var zone=zoneID;
  if(zone > 4 || zone <0 ) console.log("invalid zone");

  return {
    on: function(){
      return [0x31,0,0,0x08,0x04,0x01,0,0,0,zoneID];
    },
    off: function(){
      return [0x31,0,0,0x08,0x04,0x02,0,0,0,zoneID];
    },
    nightMode: function() {
      return [0x31,0,0,0x08,0x04,0x05,0,0,0,zoneID];
    },
    whiteMode:function() {
      return [0x31,0,0,0x08,0x05,0x64,0,0,0,zoneID];
    },
    saturationUp:function(){
      saturation=Math.min(saturation+5,0x64);
      return [0x31,0x00,0x00,0x08,0x02,saturation,0x00,0x00,0x00,zoneID]
    },
    saturationDown:function(){
      saturation=Math.max(saturation-5,0x00);
      return [0x31,0x00,0x00,0x08,0x02,saturation,0x00,0x00,0x00,zoneID]
    },
    saturationSet:function(b){
      saturation=Math.max(b,0x00);
      saturation=Math.min(b,0x64);
      return [0x31,0x00,0x00,0x08,0x02,saturation,0x00,0x00,0x00,zoneID]
    },
   brightnessUp:function(){
      brightness=Math.min(brightness+5,0x64);
      return [0x31,0x00,0x00,0x08,0x03,brightness,0x00,0x00,0x00,zoneID]
    },
    brightnessDown:function(){
      brightness=Math.max(brightness-5,0x00);
      return [0x31,0x00,0x00,0x08,0x03,brightness,0x00,0x00,0x00,zoneID]
    },
    brightnessSet:function(b){
      brightness=Math.max(b,0x00);
      brightness=Math.min(b,0x64);
      return [0x31,0x00,0x00,0x08,0x03,brightness,0x00,0x00,0x00,zoneID]
    },
    colorUp:function(){
      color=Math.min(color+5,0xFF);
      return [0x31,0x00,0x00,0x08,0x01,color,color,color,color,zoneID]
    },
    colorDown:function(){
      color=Math.max(color-5,0x00);
      return [0x31,0x00,0x00,0x08,0x01,color,color,color,color,zoneID]
    },
    colorSet:function(c){
      color=c;
      return [0x31,0x00,0x00,0x08,0x01,color,color,color,color,zoneID]
    },
    colorRGB:function(rgb){
      return rgbHandler(rgb,this);
    },
    colorTempUp:function(){
      colorTemp=Math.min(colorTemp+5,0x64);
      return [0x31,0x00,0x00,0x08,0x05,colorTemp,0,0,0,zoneID]
    },
    colorTempDown:function(){
      colorTemp=Math.max(colorTemp-5,0x00);
      return [0x31,0x00,0x00,0x08,0x05,colorTemp,0,0,0,zoneID]
    },
    colorTempSet:function(c){
      colorTemp=c;
      return [0x31,0x00,0x00,0x08,0x05,colorTemp,0,0,0,zoneID]
    },
    mode:function(mode){
      return [0x31,0x00,0x00,0x08,0x06,mode,0,0,0,zoneID]
    },
    modeSpeedUp:function(){
      return [0x31,0,0,0x08,0x04,0x03,0,0,0,zoneID]
    },
    modeSpeedDown:function(){
      return [0x31,0,0,0x08,0x04,0x04,0,0,0,zoneID]
    },
    link:function(){
      return [0x3D,0,0,0x08,0,0,0,0,0,zoneID]
    },
    unlink:function(){
      return [0x3E,0,0,0x08,0,0,0,0,0,zoneID]
    },
    command(fnName,arg){
      if (this[fnName]) {
        var cmds=this[fnName](arg);
        if (Array.isArray(cmds) && Array.isArray(cmds[0])){
          cmds.forEach(function(elem){
sendCmd(elem)})
        } else {
          sendCmd(cmds);//single cmd`
        }
      }
    }
  }
}

var zoneCtlRGBWWFactory=function(zoneID){
  var color=0x7A;
	var brightness=0x32;
  //var saturation=0x32;
  //var colorTemp=0x4B;
  var zone=zoneID;
  if(zone > 4 || zone <0 ) console.log("invalid zone");

  return {
    on: function(){
      return [0x31, 0x00, 0x00, 0x07, 0x03, 0x01, 0x00, 0x00, 0x00, zoneID];
    },
    off: function(){
      return [0x31, 0x00, 0x00, 0x07, 0x03, 0x02, 0x00, 0x00, 0x00, zoneID];
    },
    nightMode: function() {
      return [0x31, 0x00, 0x00, 0x07, 0x03, 0x06, 0x00, 0x00, 0x00, zoneID];
    },
    whiteMode:function() {
      return [0x31, 0x00, 0x00, 0x07, 0x03, 0x05, 0x00, 0x00, 0x00, zoneID];
    },
    brightnessUp:function(){
      brightness=Math.min(brightness+5,0x64);
      return [0x31, 0x00, 0x00, 0x07, 0x02, brightness, 0x00, 0x00, 0x00, zoneID]
    },
    brightnessDown:function(){
      brightness=Math.max(brightness-5,0x00);
      return [0x31, 0x00, 0x00, 0x07, 0x02, brightness, 0x00, 0x00, 0x00, zoneID]
    },
    brightnessSet:function(b){
      brightness=Math.max(b,0x00);
      brightness=Math.min(b,0xFF);
      return [0x31, 0x00, 0x00, 0x07, 0x02, brightness, 0x00, 0x00, 0x00, zoneID]
    },
    colorUp:function(){
      color=Math.min(color+5,0xFF);
      return [0x31, 0x00, 0x00, 0x07, 0x01, color, color, color, color, zoneID]
    },
    colorDown:function(){
      color=Math.max(color-5,0x00);
      return [0x31, 0x00, 0x00, 0x07, 0x01, color, color, color, color, zoneID]
    },
    colorSet:function(c){
      color=c;
      return [0x31, 0x00, 0x00, 0x07, 0x01, color, color, color, color, zoneID]
    },
    colorRGB:function(rgb){
      return rgbHandler(rgb,this);
    },
    mode:function(mode){
      return [0x31, 0x00, 0x00, 0x07, 0x04, mode, 0x00, 0x00, 0x00, zoneID]
    },
    modeSpeedUp:function(){
      return [0x31, 0x00, 0x00, 0x07, 0x03, 0x03, 0x00, 0x00, 0x00, zoneID]
    },
    modeSpeedDown:function(){
      return [0x31, 0x00, 0x00, 0x07, 0x03, 0x04, 0x00, 0x00, 0x00, zoneID]
    },
    link:function(){
      console.log("link not captured");
      return [0x3D,0,0,0x07,0,0,0,0,0,zoneID]
    },
    unlink:function(){
      console.log("link not captured");
      return [0x3E,0,0,0x07,0,0,0,0,0,zoneID]
    },
    command(fnName,arg){
      if (this[fnName]) {
        var cmds=this[fnName](arg);
        if (Array.isArray(cmds) && Array.isArray(cmds[0])){
          cmds.forEach(function(elem){sendCmd(elem)})
        } else {
          sendCmd(cmds);//single cmd`
        }
      }
    }
  }
}

var baseCtlFactory=function(){
	var color=0x7A;
	var brightness=0x32;
  var zoneID=0x01;
	return {
 		on:function(){return [0x31,0x00,0x00,0x00,0x03,0x03,0x00,0x00,0x00,zoneID]},
		off:function(){return [0x31,0x00,0x00,0x00,0x03,0x04,0x00,0x00,0x00,zoneID]},
 		whiteMode:function(){return [0x31 ,0x00 ,0x00 ,0x00 ,0x03 ,0x05 ,0x00 ,0x00 ,0x00,zoneID]},
		brightnessUp:function(){
			brightness=Math.min(brightness+5,0x64);
			return [0x31,0x00,0x00,0x00,0x02,brightness,0x00,0x00,0x00,zoneID]
		},
		brightnessDown:function(){
			brightness=Math.max(brightness-5,0x00);
			return [0x31,0x00,0x00,0x00,0x02,brightness,0x00,0x00,0x00,zoneID]
		},
		brightnessSet:function(b){
			brightness=Math.max(b,0x00);
			brightness=Math.min(b,0xFF);
			return [0x31,0x00,0x00,0x00,0x02,brightness,0x00,0x00,0x00,zoneID]
		},
		colorUp:function(){
			color=Math.min(color+5,0xFF);
			return [0x31,0x00,0x00,0x00,0x01,color,color,color,color,zoneID]
		},
		colorDown:function(){
			color=Math.max(color-5,0x00);
			return [0x31,0x00,0x00,0x00,0x01,color,color,color,color,zoneID]
		},
		colorSet:function(c){
			color=c;
			return [0x31,0x00,0x00,0x00,0x01,color,color,color,color,zoneID]
		},
    colorRGB:function(rgb){
      return rgbHandler(rgb,this);
    },
		mode:function(mode){
			return [0x31,0x00,0x00,0x00,0x04,mode,0,0,0,zoneID]
		},
    command(fnName,arg){
      if (this[fnName]) {
        var cmds=this[fnName](arg);
        if (Array.isArray(cmds) && Array.isArray(cmds[0])){
          cmds.forEach(function(elem){sendCmd(elem)})
        } else {
          sendCmd(cmds);//single cmd`
        }
      }
    }
	}

};

var bridgeID;
var bridgeID2;
var seqNum=0x02;

var sendCmd = function(CMD,repeats){
	if (typeof repeats === 'undefined') { repeats = DEFAULT_REPEATS};

	var out=[];
	//console.log("#"+WB.toString('hex')+"-"+CMD.toString("hex"));
	out=out.concat(PREAMPLE,bridgeID,bridgeID2,0x00,seqNum,FILLER,CMD)
	var chkSum=calcCheckSum(out);
	out =	out.concat(chkSum);
	//console.log(JSON.stringify(out));
	if (debug) console.log("#"+out.toString('hex'));
	out=new Buffer(out);
	seqNum=(seqNum+1)%256;
  	if(debug) console.log("Sending: " + out.toString('hex'));
	for (var i=0;i<repeats;i++){
  		socket.send(out,0,out.length,DEFAULT_PORT,DEFAULT_HOST,function(){});
	}
}

/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSV representation
 */
 function rgbHandler(rgb,lights){
   var hsv=rgbToHsv(rgb[0],rgb[1],rgb[2]);
   var out=new Array();
   if (lights.colorSet) out.push(lights.colorSet(hsv[0]))
   if (lights.saturationSet) out.push(lights.saturationSet(hsv[1]))
   return out;

 }
function rgbToHsv(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;

  var d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }
  return [ Math.floor(h*0xFF), Math.floor(s*100), Math.floor(v*100) ];
}



var buildFrame = function(WB,WB2,CMD,ZONE){
	var out=[];
	//console.log("#"+WB.toString('hex')+"-"+CMD.toString("hex"));
	if (debug) console.log("WB: "+ WB.toString("hex")+ " "+WB2.toString("hex") +" CMD: "+CMD.toString("hex"))
	out=out.concat(PREAMPLE,WB,WB2,0x00,seqNum,FILLER,CMD,ZONE)
	var chkSum=calcCheckSum(out);
	out =	out.concat(chkSum);
	if (debug) console.log("out: "+ (new Buffer(out)).toString('hex'))
	//console.log(JSON.stringify(out));
	//console.log("#"+out.toString('hex'));
	seqNum=(seqNum+1)%256;
	return new Buffer(out);
}

var sendFrame=function(payload){
	if(debug) console.log("Sending: " + payload.toString('hex'));
	socket.send(payload,0,payload.length,DEFAULT_PORT,DEFAULT_HOST,function(){});
}

var sendKeepAlive=function(){
	var out=new Buffer([0xD0,0x00,0x00,0x00,0x02,bridgeID,bridgeID2]);
	sendFrame(out);
}

var calcCheckSum=function(aFrame){

  var add=function(a,b){
	   return a+b;
  };

  var sub = aFrame.slice(Math.max(aFrame.length - 11, 0)) ;
  var val=sub.reduce(add,0)
  var val1=Math.floor(val / 0xff)
  var val2=val % 0xff
  return [val1, val2]

}

var _func={};

_func['2800000011']=function(msg){
  //response to initiate
	var unknown1=msg.slice(5,7);
	var mac=msg.slice(7,13);
	var fixed=msg.slice(13,15);
	var unknown2=msg.slice(15,19);
	var counter=msg.slice(19,20);
	var counter2=msg.slice(20,21);
	var padding=msg.slice(20);
 if (debug) { 
	console.log("0:" +msg.toString('hex'));
	console.log("1:" +unknown1.toString('hex'));
	console.log("2:" +mac.toString('hex'));
	console.log("2a:" +fixed.toString('hex'));
	console.log("3:" +unknown2.toString('hex'));
	console.log("4:" +counter.toString('hex'));
	console.log("5:" +padding.toString('hex'));
  }
	bridgeID=new Uint8Array(counter);
	bridgeID2=new Uint8Array(counter2);
//80:00:00:00:11:c1:01:00:0b:00:33:00:00:00:00:00:00:00:00:00:00:33

  //complete initiation
	if (debug) console.log("BridgeID: "+ bridgeID.toString("hex"))
	if (debug) console.log("BridgeID2: "+ bridgeID2.toString("hex"))
	var nFrame=buildFrame(bridgeID,bridgeID2,[0x33,0,0,0,0,0,0,0,0,0],0x00);
	sendFrame(nFrame);

  //start keepalive
	setInterval(sendKeepAlive,10000);
};

_func['8800000003']=function(msg){
	//ERROR - Confirmation?
	var code= msg.slice(0,5);
	var unknown1 = msg.slice(5,8);
	if (debug) console.log("0:" +msg.toString('hex'));
	if (debug) console.log("1:" +unknown1.toString('hex'));
	if (debug) console.log("ID:"+bridgeID.toString('hex'));
}

_func['d800000007']=function(){
	//keepalive response
}
var socket=dgram.createSocket({type:'udp4',reuseAddr:true});

socket.on("message", (msg, rinfo) => {
  //console.log('Received %d bytes from %s:%d\n',
  //            msg.length, rinfo.address, rinfo.port);
  var hmsg=msg.toString('hex');
  var resp=(msg.toString('hex').substring(0,10));
  if (_func[resp]) {
    _func[resp](msg)
  } else {
    console.log("Unknown code");
    console.log(hmsg);
  }
});

var initiate=function(host,port){
	//socket.send(payload,0,payload.length,DEFAULT_PORT,DEFAULT_HOST,function(a,b){});
	DEFAULT_HOST=host;
	DEFAULT_PORT=port;
  socket.bind();
  //socket.bind(DEFAULT_PORT);
  var payload=new Buffer([0x20,0x00,0x00,0x00,0x16,0x02,0x62,0x3a,0xd5,0xed,0xa3,0x01,0xae,0x08,0x2d,0x46,0x61,0x41,0xa7,0xf6,0xdc,0xaf,0xfe,0xf7,0x00,0x00,0x1e]);
if (debug) console.log(payload.toString('hex'));
	sendFrame(payload);
};




    exports.initiate= initiate;
    exports.baseCtlFactory= baseCtlFactory;
    exports.zoneCtlRGBWFactory= zoneCtlRGBWFactory;
    exports.zoneCtlRGBWWFactory= zoneCtlRGBWWFactory;
    exports.sendCmd= sendCmd;
