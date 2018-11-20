Alexa Skill to control my SmartHome

http://www.intranet-of-things.com/smarthome/infrastructure/control/voice/

How to use

1. Prepare default configuration files

```console
cp .env.default .env
cp ./config/environment.js.default ./config/environment.js
cp ./config/openhab.js.default ./config/openhab.js
cp ./config/test.js.default ./config/test.js
```
and adapt it to your needs

2. Install nodejs6 and run

```console
npm6 install
npm6 run deploy
```
