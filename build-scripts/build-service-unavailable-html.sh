#!/bin/bash

# Get positional arguments to script
htmlFilePath=$1 # destination file path for html file
cssFilePath=$2 # path to compiled css file

echo "Building service-unavailable html file at $htmlFilePath..."
ts-node ./build-scripts/build-service-unavailable-html.ts $htmlFilePath

echo "Extracting css from $cssFilePath..."
styling=$(grep -o '.*' $cssFilePath)

# Escape special characters
escapedStyling=${styling//$'~'/\\~}
escapedStyling=$( echo $escapedStyling | sed 's~\!~\\\\!~g' )

# Replace contents of style tag in html file with that passed in from grep
sed -i '' "s~This will be replaced in the build script.~$escapedStyling~" $htmlFilePath

echo "Finished creating static service-unavailable page at $htmlFilePath"
