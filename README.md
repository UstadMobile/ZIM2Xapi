# ZIM to xAPI Converter

This command-line tool helps you convert ZIM files into xAPI packages

### Features

- List available channels from Kolibri servers.
- List topics for a specific Kolibri channel.
- Download a Kolibri topic as a ZIM file and convert it to xAPI.

### Install Required Dependencies

Before proceeding, ensure that you have the following tools installed on your platform:

- **zimDump**: This tool is necessary for working with ZIM files. You can download and install the version suitable for your platform from the [zim-tools release page](https://download.openzim.org/release/zim-tools/).


- **kolibri2zim**: This tool converts Kolibri content into ZIM files. You have two options:
    - Install `kolibri2zim` directly by following the instructions on the [kolibri2zim GitHub repository](https://github.com/openzim/kolibri).
    - Alternatively, use Docker to run `kolibri2zim` without manually installing it. You can find the installation guide on the [Docker documentation page](https://docs.docker.com/get-docker/).

## Usage

Once you have the JAR file and the required dependencies installed, you can use the following commands:

Khan2Xapi provides three main subcommands:

- list-channels: Lists all available channels from Kolibri servers.
- list-topics: Lists topics within a specific channel and lists sub-topics within a topic
- download-topic: Downloads a topic as a ZIM file and converts it into an xAPI file.

### List Channels

Lists all available channels with their channelId from Kolibri servers.

```bash
java -jar zim2xapi.jar list-channels
```

### List Topics

The list-topics command lists topics within a specific channel. Up to one level of subtopics will be displayed. To list the deeper subtopics run the command again for the given subtopic id.

```bash
java -jar zim2xapi.jar list-topics -id <channel/topic id>
```

### Download a topic 

You can download a topic from a Kolibri channel or directly from an existing ZIM file.

#### Option 1: Download from a Kolibri Channel

If you have a Kolibri channel ID and topic ID, use the following command:
```bash
java -jar zim2xapi.jar download-topic -channel-id <channel-id> -topic-id <topic-id> 
```
This command downloads the specified topic from the channel and converts it to xAPI format.

#### Option 2: Use an Existing ZIM File

If you already have a ZIM file, you can extract and convert the content using:
```bash
java -jar zim2xapi.jar download-topic -zim-file /path/to/zimfile.zim
```
This command extracts and converts the ZIM file to the xAPI format.

### Additional Options

For more details on available options, use the --help flag with any command, such as:

```bash
java -jar zim2xapi.jar download-topic --help
```