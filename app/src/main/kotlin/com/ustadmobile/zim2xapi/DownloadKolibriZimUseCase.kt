package com.ustadmobile.zim2xapi

import java.io.File
import java.io.FileNotFoundException

class DownloadKolibriZimUseCase {

    operator fun invoke(
        channelId: String,
        topicId: String,
        outputDir: File,
        fileName: String
    ): File {
        return try {
            // used so that kolibri doesn't generate a random name
            val zimFileName = "$fileName.zim"

            val zimCommand = buildList {
                add("docker")
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

            println("Running: ${zimCommand.joinToString(" ")}")
            val process = ProcessBuilder(zimCommand).directory(outputDir).start()
            process.printBuffer()
            process.waitFor()

            val zimFile = File(outputDir, zimFileName)

            if (!zimFile.exists()) {
                throw FileNotFoundException("Zim file not found")
            }

            zimFile
        } finally {
            val stopCommand = "docker stop $fileName".split(" ")
            ProcessBuilder(stopCommand).start().waitFor()
            // Remove the container
            val removeCommand = "docker rm $fileName".split(" ")
            ProcessBuilder(removeCommand).start().waitFor()
        }
    }

}