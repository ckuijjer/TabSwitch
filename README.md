# TabSwitch

A tab switching extension for Google Chrome

## package

To package a version that can be uploaded to the Chrome Web Store

```sh
mkdir package
cd package
rm TabSwitch.zip
rm -rf TabSwitch
cp -r ../app TabSwitch
zip -r TabSwitch.zip TabSwitch
```

## format

```sh
npx prettier --write .
```
