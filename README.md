# ZIM2Xapi

This command-line tool helps you convert ZIM files into xAPI packages. ZIM files can contain Wikipedia content, Khan Academy videos and/or exercises, and various others content types.

xAPI packages are supported by many learning management systems. This tool is intended to facilitate using open educational resources in different learning management systems and/or other apps.
xAPI packages generally work well in offline/limited connectivity use cases.

This is a conversion tool developed by UstadMobile FZ-LLC. It is unofficial and is not endorsed by any content provider (e.g. Khan Academy, Wikipedia, or any other). The user is responsible
to abide by the terms of all relevant licenses.

For Wikipedia content: see [Wikipedia reusers rights and obligations](https://en.wikipedia.org/wiki/Wikipedia:Copyrights#Reusers'_rights_and_obligations).

For Khan Academy content: see [Khan Academy's reuse terms](https://support.khanacademy.org/hc/en-us/articles/202262954-Can-I-use-Khan-Academy-s-videos-name-materials-links-in-my-project).

For any other content: check the license provided by the author.

### Features

- Convert a ZIM file to an xAPI package. Can optionally download ZIM files directly using kolibri2zim (e.g. to download specific Khan Academy lesson, etc)
- List available channels from Kolibri servers.
- List topics for a specific Kolibri channel.

### Install Required Dependencies

Before proceeding, ensure that you have the following tools installed on your platform:

- **zimDump**: This tool is necessary for working with ZIM files. You can download and install the version suitable for your platform from the [zim-tools release page](https://download.openzim.org/release/zim-tools/).

- **kolibri2zim**: This tool converts Kolibri content into ZIM files. You have two options:
    - Install `kolibri2zim` directly by following the instructions on the [kolibri2zim GitHub repository](https://github.com/openzim/kolibri).
    - Alternatively, use Docker to run `kolibri2zim` without manually installing it. You can find the installation guide on the [Docker documentation page](https://docs.docker.com/get-docker/).

## Usage

Once you have the JAR file and the required dependencies installed, you can use the following commands:

Khan2Xapi provides three main subcommands:

- convert: converts a ZIM file to an xAPI file. This can be a local file or can be fetched using a Kolibri channel ID and topic ID
- list-channels: Lists all available channels from Kolibri servers.
- list-topics: Lists topics within a specific channel and lists sub-topics within a topic

### Convert ZIM to xAPI

This command converts a ZIM file to an xAPI file. 
This can be a local file or can be fetched using a Kolibri channel ID and topic ID

#### Option 1: Use an Existing ZIM File

If you already have a ZIM file, you can extract and convert the content using:
```bash
java -jar zim2xapi.jar convert -zim-file /path/to/zimfile.zim
```
This command extracts and converts the ZIM file to the xAPI format.

#### Option 2: Download from a Kolibri Channel

If you have a Kolibri channel ID and topic ID, use the following command:
```bash
java -jar zim2xapi.jar convert -channel-id <channel-id> -topic-id <topic-id> 
```
This command downloads the specified topic from the channel and converts it to xAPI format.

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

### Additional Options

For more details on available options, use the --help flag with any command, such as:

```bash
java -jar zim2xapi.jar convert --help
```
