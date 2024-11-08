# update-zim.sh
#!/bin/bash

# Define the directory for ZIM files
ZIM_DIR="e2e/content"
JAR_PATH="build/libs/zim2xapi.jar"
KHAN_CHANNEL_ID="c9d7f950ab6b5a1199e3d6c10d7f0103"

# Remove existing ZIM files
echo "Deleting old ZIM files in $ZIM_DIR..."
rm -rf "$ZIM_DIR"/*

# Define a single array with formatted strings for each key-topicid pair
# sorter contains radio and categorizer interaction types as well
zimConfigs=(
   "input_number:1c0d768b95525123834aac5378343254"
    "orderer:bc3ac45347f3556ba8169b59ae452b01"
    "radio:0daa93592e65506f8960affd553b6fcd"
    "dropdown:a5bc204859ca5d44a738516e7c8a274d"
    "sorter:67060e6e557a5df185c26048ec879ffc"
    "matcher:5a3270e2613a507f954c267279c2f107"
)

for config in "${zimConfigs[@]}"; do

    IFS=":" read -r key topicid <<< "$config"  # Split the string by ":"
    
    echo "Processing $key with topicid $topicid"
    
    # Generate new ZIM files
    echo "Generating new ZIM files..."
    java -jar $JAR_PATH convert -channel-id $KHAN_CHANNEL_ID -topic-id $topicid -output $ZIM_DIR -name $key

    # Check if the command succeeded
    if [ $? -eq 0 ]; then
        echo "ZIM file for $key generated successfully."
    else
        echo "Error: Failed to generate ZIM file for $key."
        exit 1
    fi

    # Delete the .zip file generated
    zipFile="$ZIM_DIR/$key.zip"
    if [ -f "$zipFile" ]; then
        echo "Deleting $zipFile"
        rm "$zipFile"
    else
        echo "Warning: $zipFile not found."
    fi
done


echo "All ZIM files generated successfully."
