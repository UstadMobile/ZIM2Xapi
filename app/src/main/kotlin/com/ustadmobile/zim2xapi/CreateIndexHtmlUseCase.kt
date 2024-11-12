package com.ustadmobile.zim2xapi

import com.ustadmobile.zim2xapi.utils.FileConstants
import java.io.File

class CreateIndexHtmlUseCase(private val zimDumpProcess: ProcessBuilderUseCase) {

    operator fun invoke(
        zimFile: File,
        zimFolder: File
    ) {

        val exceptionsFolder = File(zimFolder, FileConstants.EXCEPTIONS_FOLDER)
        val indexHtmlFile = File(zimFolder, FileConstants.INDEX_HTML_FILE)

        // If index.html already exists, assume the work is done and return
        if (indexHtmlFile.exists()) {
            return
        }

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

        val successRename = fileToRename.renameTo(File(zimFolder, FileConstants.INDEX_HTML_FILE))
        if (!successRename) {
            throw Exception("Failed to rename $mainPage to ${FileConstants.INDEX_HTML_FILE}")
        }

    }
}