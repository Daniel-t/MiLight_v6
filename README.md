# MiLight v6 

This is a library for controlling MiLight/LimitlessLed/AppLamp/etc lights connected to a v6 bridge.

## Usage

~~~
var mb=require('./milight.js');

mb.initiate(BRIDGE_IP,BRIDGE_PORT);

//control the Bridge Lamp
var baseCtl=mb.baseCtlFactory();

//control the first RGBW zone
var z1=mb.zoneCtlRGBWFactory(0x01);

//control the second RGBWW zone
var z2=mb.zoneCtlRGBWWFactory(0x02);


//Method 1
mb.sendCmd(z1.on());
mb.sendCmd(z1.colorSet(0x20));

//Method 2
z1.command("on")
z1.command("colorSet",0x20)
~~~

## Commands

The following commands are valid (where the zone supports it)

on
off
colorRGB (parameter [r,g,b])
colorSet (parameter 0x00-0xFF)
colorUp
colorDown
brightnessSet (parameter 0x00-0x64)
brightnessUp
brightnessDown
saturationSet (parameter 0x00-0x64)
saturationUp
saturationDown
link
unlink
