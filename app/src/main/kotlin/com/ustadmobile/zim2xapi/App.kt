/*
 * This source file was generated by the Gradle 'init' task
 */
package com.ustadmobile.zim2xapi

import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.core.main
import com.github.ajalt.clikt.parameters.options.option
import com.github.ajalt.clikt.core.subcommands
import com.github.ajalt.clikt.parameters.options.convert
import com.github.ajalt.clikt.parameters.options.default
import com.github.ajalt.clikt.parameters.options.required
import com.github.ajalt.clikt.parameters.types.file
import com.ustadmobile.zim2xapi.Client.client
import com.ustadmobile.zim2xapi.Client.json
import com.ustadmobile.zim2xapi.SysPathUtil.commandExists
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import java.io.File

object Client {
    // Create a single OkHttpClient instance
    val client: OkHttpClient by lazy {
        OkHttpClient()
    }

    val json: Json by lazy {
        Json {
            ignoreUnknownKeys = true
        }
    }
}

// share same option with multiple subcommands
abstract class EndpointCommand(name: String) : CliktCommand(name) {
    val endpoints by option("--endpoint", "-e")
        .convert { it.split(",") }
        .default(
            listOf(
                "https://kolibri-demo.learningequality.org",
                "https://kolibri-catalog-en.learningequality.org"
            )
        )
}

class ListKolibriChannels : EndpointCommand(name = "list-channels") {
    override fun run() {
        ListKolibriChannelsUseCase(client, json).invoke(endpoints)
    }
}

class KolibriTopics : EndpointCommand(name = "list-topics") {
    override val printHelpOnEmptyArgs = true

    val id by option(
        "-id", "-channel-id", "-topic-id",
        help = "The ID of the channel to list topics for"
    ).required()

    override fun run() {
        try {
            ListKolibriTopicsUseCase(client, json).invoke(id, endpoints)
        } catch (e: Exception) {
            echo(e.stackTrace, err = true)
            echo(e.message, err = true)
        }
    }

}

class DownloadTopic : CliktCommand(name = "download-topic") {
    override val printHelpOnEmptyArgs = true

    val channelId by option("-channel-id", help = "The channel ID")

    val topicId by option("-topic-id", help = "The topic ID to download")

    val zimDumpPath by option(
        "-zim-dump-path",
        help = "The path to the zimdump binary - can be downloaded from https://download.openzim.org/release/zim-tools/"
    ).file(mustExist = true, canBeDir = false)

    val zimFile by option("-zim-file", help = "Path to an existing ZIM file")
        .file(mustExist = true, canBeDir = false, mustBeReadable = true)

    val kolibiri2zimPath by option(
        "-kolibri2zim-path",
        help = "The path to the kolibri2zim binary - can be downloaded from https://github.com/openzim/kolibri"
    ).file(mustExist = true, canBeDir = false)


    val outputDir by option("-dir", "-output", help = "The output directory for the xApi file")
        .file(canBeFile = false, mustBeWritable = true)
        .default(File(".").canonicalFile)

    val fileName by option("-name", help = "The name of the xApi file")

    override fun run() {

        val processBuilderUseCase = ProcessBuilderUseCase()

        // zimDump required to extract the ZIM file
        if (!commandExists("zimdump", zimDumpPath)) {
            echo(
                "zimdump not found. Please install it from https://download.openzim.org/release/zim-tools/",
                err = true
            )
            return
        }

        val channelId = channelId
        val topicId = topicId
        val zimFile = zimFile

        val createdZimFile: File = zimFile ?: if (channelId != null && topicId != null) {

            val isKhan = KhanChannels.channels.contains(channelId)
            if (isKhan) {
                val licenseText = this::class.java.classLoader.getResource("khan-license-notice.txt")?.readText() ?: ""
                echo(licenseText)
            }

            val (cmdPath, isKolibriAvailable) = GetKolibri2ZimUseCase(processBuilderUseCase)
                .isKolibriAvailable(kolibiri2zimPath)

            DownloadKolibriZimUseCase(processBuilderUseCase).invoke(
                channelId,
                topicId,
                outputDir,
                fileName ?: topicId,
                isKolibriAvailable,
                cmdPath
            )
        } else {
            echo("You must provide either a ZIM file or a Kolibri channel ID and topic.", err = true)
            return
        }

        val fileName = fileName ?: createdZimFile.nameWithoutExtension

        // extract it to a folder,so we can easily zip it later
        val extractedZimFolder = File(outputDir, fileName)
        extractedZimFolder.mkdirs()

        // extract the zim
        ExtractZimUseCase(processBuilderUseCase).invoke(createdZimFile, extractedZimFolder)

        // fix any exceptions found in the folder
        FixExtractZimExceptions(processBuilderUseCase).invoke(createdZimFile, extractedZimFolder)

        // create the xApi zip file
        CreateXapiFileUseCase(processBuilderUseCase).invoke(extractedZimFolder, outputDir, fileName, createdZimFile)

    }
}

object KhanChannels {

    val channels: List<String> = listOf(
        "c9d7f950ab6b5a1199e3d6c10d7f0103",
        "6616efc8aa604a308c8f5d18b00a1ce3",
        "f5b71417b1f657fca4d1aaecd23e4067",
        "878ec2e6f88c5c268b1be6f202833cd4",
        "2ac071c4672354f2aa78953448f81e50",
        "c3231d844f8d5bb1b4cbc6a7ddd91eb7",
        "a03496a6de095e7ba9d24291a487c78d",
    )

}

class Khan2Xapi : CliktCommand() {
    override val printHelpOnEmptyArgs = true
    override fun run() = Unit
}

fun main(args: Array<String>) {
    Khan2Xapi()
        .subcommands(
            ListKolibriChannels(),
            KolibriTopics(),
            DownloadTopic()
        )
        .main(args)
}
