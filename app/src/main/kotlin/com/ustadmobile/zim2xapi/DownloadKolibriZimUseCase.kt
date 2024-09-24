package com.ustadmobile.zim2xapi

import java.io.File
import java.io.FileNotFoundException

class DownloadKolibriZimUseCase(
    private val process: ProcessBuilderUseCase
) {

    operator fun invoke(
        channelId: String,
        topicId: String,
        outputDir: File,
        fileName: String,
        isKolibriAvailable: Boolean,
        cmdPath: File
    ): File {
        return try {
            // used so that kolibri doesn't generate a random name
            val zimFileName = "$fileName.zim"

            val zimCommand = buildList {
                if (!isKolibriAvailable) {
                    add("run")
                    // name of docker container - to be deleted later
                    add("--name")
                    add(fileName)
                    // Volume mapping between the host and the container
                    add("-v")
                    add("${outputDir.absolutePath}:/output")
                    // Docker image to use (openzim Kolibri image)
                    add("ghcr.io/openzim/kolibri")
                    // Command to execute inside the container
                    add(Kolibri2Zim)
                }
                // Channel ID parameter for the kolibri2zim command
                add(CHANNEL_ID)
                add(channelId)
                // topic ID parameter for the kolibri2zim command
                add(TOPIC_ID)
                add(topicId)
                // Zim file name
                add("--zim-file")
                add(zimFileName)
                // ZIM name. Used as identifier by kolibri
                add("--name")
                add(fileName)
                // title of the zim. limited characters due to errors of title too long
                add("--title")
                add(topicId.substring(0, 10))
            }
            process.invoke(
                cmdPath.absolutePath,
                zimCommand.joinToString(" ")
            )

            val zimFile = File(outputDir, zimFileName)

            if (!zimFile.exists()) {
                throw FileNotFoundException("Zim file not created")
            }

            zimFile
        } finally {
            // stop and remove the container
            process.invoke(DOCKER, "stop $fileName")
            process.invoke(DOCKER, "rm $fileName")
        }
    }

    companion object {

        const val DOCKER = "docker"
        const val Kolibri2Zim = "kolibri2zim"

        const val CHANNEL_ID = "--channel-id"
        const val TOPIC_ID = "--root-id"

    }

}