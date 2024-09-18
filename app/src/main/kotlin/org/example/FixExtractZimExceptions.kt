package org.example

import java.io.File
import java.io.FileFilter
import java.io.InputStreamReader

class FixExtractZimExceptions(
    val zimFile: File,
    val zimFolder: File
) {

    operator fun invoke() {
            val zimdumpCommand = listOf("zimdump","info",zimFile.absolutePath)
            val processBuilder = ProcessBuilder(zimdumpCommand)
            val process = processBuilder.start()

            // Capture the command output
            val output = InputStreamReader(process.inputStream).readText()

            // Wait for the process to complete
            process.waitFor()

            // Parse the output to find the "mime-type" field
            val mimeTypeLine = output.lines().find { it.trim().startsWith("* mime-type:") }

            val mimetype = mimeTypeLine?.split(":")?.get(1)?.trim()

            //it.renameFileBasedOnMimeType(mimetype)
          /*

            // Execute the command using ProcessBuilder


            // Extract and return the MIME type
           */


        val exceptionsFolder = File(zimFolder, "_exceptions")

        if (!exceptionsFolder.exists()) {
            return
        }


    }

}