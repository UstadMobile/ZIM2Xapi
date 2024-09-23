package com.ustadmobile.zim2xapi

import java.io.File
import java.io.InputStreamReader
import java.net.URLDecoder

class FixExtractZimExceptions(process: ProcessBuilderUseCase) {

    operator fun invoke(
        zimFile: File,
        zimFolder: File
    ) {

        val exceptionsFolder = File(zimFolder, "_exceptions")

        if (!exceptionsFolder.exists()) {
            // no errors found when extracting
            return
        }

        exceptionsFolder.walkTopDown().forEach { file ->
            if (file.isFile) {
                println("working with file ${file.name}")
                val decodedPath = URLDecoder.decode(file.name, "UTF-8")
                println("decoded Path $decodedPath")
                val decodedFile = File(zimFolder, decodedPath)
                if (decodedPath.contains("/")) {
                    // decoded file path has a path structure (contains '%2F')
                    handleFolderConflict(zimFolder, decodedPath, zimFile, exceptionsFolder, file)
                } else {
                    handleFileConflict(zimFolder, decodedFile)
                }

                // Adjust base path

                // If file exists, there is a name conflict issue.
                /*   if (decodedFile.exists()) {
                       //
                   }*/


                /* val parentDir = decodedFile.parentFile
                 if (!parentDir.exists()) {
                     parentDir.mkdirs()  // Create all necessary directories
                 }
                 Files.move(
                     file.toPath(),
                     decodedFile.toPath(),
                     StandardCopyOption.REPLACE_EXISTING
                 )*/
            }
        }


        //
        /*

          // Execute the command using ProcessBuilder


          // Extract and return the MIME type
         */
    }

    private fun handleFolderConflict(
        rootFolder: File,
        decodedPath: String,
        zimFile: File,
        exceptionsFolder: File,
        currentFile: File
    ): File {
        val pathParts = decodedPath.split("/")
        var currentDir = rootFolder
        println("fixing folder issues. in $currentDir")
        for (i in 0 until pathParts.size - 1) {
            val folderName = pathParts[i]
            val folderInCurrentDir = File(currentDir, folderName)
            println("")
            // If a file exists where a folder is needed, rename the file
            if (folderInCurrentDir.exists() && folderInCurrentDir.isFile) {
                // rename the file
                println("found a file with the same directory as the folder to be created")
                println("$folderInCurrentDir file name")
                val mimeType = getMimeType(zimFile, folderInCurrentDir.name)
                folderInCurrentDir.renameFileBasedOnMimeType(mimeType)
                println("fixed file conflict")
                folderInCurrentDir.mkdirs()
                println("create the directory now")
            } else if (!folderInCurrentDir.exists()) {
                println("create the directory now")
                folderInCurrentDir.mkdirs()  // Create the directory
            }
            currentDir = folderInCurrentDir
        }
        val fileName = pathParts.last()

        println("working with file $fileName in $currentDir")
        val targetFile = File(currentDir, fileName)
        targetFile.parentFile.mkdirs()

        val renameSuccess = currentFile.renameTo(targetFile)

        println("renamed $renameSuccess file to ${targetFile.absolutePath}")
        println("trying to move the file $fileName to its right location $currentDir")
        return targetFile
    }

    private fun handleFileConflict(rootFolder: File, decodedFile: File) {
        val existingFile = File(rootFolder, decodedFile.name)

        // There's a conflict because a folder with this name exists
        if (existingFile.exists() && existingFile.isDirectory) {
            val mimeType = getMimeType(rootFolder, rootFolder.name)
            decodedFile.renameFileBasedOnMimeType(mimeType)
            decodedFile.moveFileToFolder(rootFolder)
        }
    }

    private fun getMimeType(zimFile: File, fileName: String): String? {
        val zimdumpCommand = listOf("zimdump", "list", "--url=$fileName", zimFile.absolutePath)
        println(zimdumpCommand.joinToString(" "))
        val processBuilder = ProcessBuilder(zimdumpCommand)
        val process = processBuilder.start()

        // Capture the command output
        val output = InputStreamReader(process.inputStream).readText()

        // Wait for the process to complete
        process.waitFor()

        // Parse the output to find the "mime-type" field
        val mimeTypeLine = output.lines().find { it.trim().startsWith("* mime-type:") }

        return mimeTypeLine?.split(":")?.get(1)?.trim()
    }

}