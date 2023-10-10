#!/bin/sh

source="public/.well-known/apple-app-site-association"
if [ ! -f "$source" ]; then
  echo "Error: $source file not found"
  exit 1
fi

app_id=$IOS_APP_ID
if [ -z "$app_id" ]; then
  echo "Error: IOS_APP_ID is empty"
  exit 1
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/{PLACE_YOUR_APP_ID_HERE}/$app_id/g" $source
else
    sed -i "s/{PLACE_YOUR_APP_ID_HERE}/$app_id/g" $source
fi