package com.ustadmobile.zim2xapi

import java.io.File
import java.net.URLDecoder

class FixExtractZimExceptionsUseCase(private val zimDumpProcess: ProcessBuilderUseCase) {

    operator fun invoke(
        zimFile: File,
        zimFolder: File
    ) {

        val exceptionsFolder = File(zimFolder, EXCEPTIONS_FOLDER_NAME)

        // get the mainpage of the zim and rename it to index.html
        val infoOutput = zimDumpProcess.invoke("info ${zimFile.absolutePath}")
        val mainPageLine = infoOutput.lines().find { it.trim().startsWith("main page:") }
        val mainPage = mainPageLine?.split(":")?.get(1)?.trim()
            ?: throw Exception("Zim mainPage not provided by zimdump")

        // it will be located in either of these folders
        val mainPageFile = File(zimFolder, mainPage)
        val mainFile = File(exceptionsFolder, mainPage)

        val fileToRename = when {
            mainPageFile.exists() && mainPageFile.isFile -> mainPageFile
            mainFile.exists() && mainFile.isFile -> mainFile
            else -> throw Exception("Zim main page not found in extracted folder")
        }

        val successRename = fileToRename.renameTo(File(zimFolder, INDEX_HTML))
        if(!successRename){
            throw Exception("Failed to rename $mainPage to $INDEX_HTML")
        }

        if (!exceptionsFolder.exists()) {
            // no errors found when extracting
            return
        }


        // fix each file found in exceptions folder
        exceptionsFolder.walkTopDown().forEach { file ->
            if (file.isFile) {
                val decodedPath = URLDecoder.decode(file.name, "UTF-8")
                val decodedFile = File(zimFolder, decodedPath).also {
                    it.parentFile.mkdirs()
                }

                val success = file.renameTo(decodedFile)

                if (!success) {
                    throw Exception("Failed to move file from exceptions folder")
                }

            }
        }

        // check folder is empty
        if(exceptionsFolder.listFiles()?.isNotEmpty() == true){
            throw Exception("Cannot proceed: There are unprocessed files in the exceptions folder")
        }else{
            if (!exceptionsFolder.delete()) {
                throw Exception("Failed to delete the exceptions folder: ${exceptionsFolder.absolutePath}. Check if the folder is empty and accessible.")
            }
        }
    }

    companion object {

        const val EXCEPTIONS_FOLDER_NAME = "_exceptions"
        const val INDEX_HTML = "index.html"

    }

}