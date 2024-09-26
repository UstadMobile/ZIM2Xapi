package com.ustadmobile.zim2xapi

import java.io.File
import java.io.FileNotFoundException

class DownloadKolibriZimUseCase(
    private val kolbri2Zim: ProcessBuilderUseCase
) {

    operator fun invoke(
        channelId: String,
        topicId: String,
        outputDir: File,
        fileName: String,
    ): File {
        // used so that kolibri doesn't generate a random name
        val zimFileName = "$fileName.zim"

        val zimCommand = buildList {
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
        kolbri2Zim.invoke(zimCommand.joinToString(" "))

        val zimFile = File(outputDir, zimFileName)

        if (!zimFile.exists()) {
            throw FileNotFoundException("Zim file not created")
        }

        return zimFile
    }

    companion object {

        const val CHANNEL_ID = "--channel-id"
        const val TOPIC_ID = "--root-id"

    }

}