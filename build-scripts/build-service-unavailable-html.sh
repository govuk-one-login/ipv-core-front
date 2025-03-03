#!/bin/sh

# Get positional arguments to script
htmlFilePath=$1 # destination file path for html file
cssFilePath=$2 # path to compiled css file

echo "Building service-unavailable html file at $htmlFilePath..."
ts-node ./build-scripts/build-service-unavailable-html.ts $htmlFilePath

# Create copy of css file
# The css needs to stay in a file as extracting it into an env variable results in "Arguments too long" errors
cp $cssFilePath tempStyle.css

# Add style tags to beginning and end of temp style file
echo '<style>' | cat - tempStyle.css > temp && mv temp tempStyle.css
echo '</style>' | cat tempStyle.css - > temp && mv temp tempStyle.css

echo "Adding styling to $htmlFilePath..."
# sed --inline flag isn't compatible on all OS and so to update the html file, we need to save it to a temp file and rename it
sed -e '/This will be replaced in the build script./ {' -e 'r tempStyle.css' -e 'd' -e '}' $htmlFilePath > tmpHtml.html
mv tmpHtml.html $htmlFilePath

# delete temp style file
rm tempStyle.css

echo "Finished creating static service-unavailable page at $htmlFilePath"
