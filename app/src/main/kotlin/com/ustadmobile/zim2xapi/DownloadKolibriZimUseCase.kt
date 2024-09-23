package com.ustadmobile.zim2xapi

import java.io.File
import java.io.FileNotFoundException

class DownloadKolibriZimUseCase(private val process: ProcessBuilderUseCase) {

    operator fun invoke(
        channelId: String,
        topicId: String,
        outputDir: File,
        fileName: String
    ): File {
        return try {
            // used so that kolibri doesn't generate a random name
            val zimFileName = "$fileName.zim"

            // TODO change to use either docker or kolibri2zim based on if the user has the right commands
            val zimCommand = buildList {
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
                add("kolibri2zim")
                // Channel ID parameter for the kolibri2zim command
                add("--channel-id")
                add(channelId)
                // topic ID parameter for the kolibri2zim command
                add("--root-id")
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
                "docker",
                zimCommand.joinToString(" ")
            )

            val zimFile = File(outputDir, zimFileName)

            if (!zimFile.exists()) {
                throw FileNotFoundException("Zim file not found")
            }

            zimFile
        } finally {
            // stop and remove the container
            process.invoke("docker", "stop $fileName")
            process.invoke("docker", "rm $fileName")
        }
    }

}