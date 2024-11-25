package com.ustadmobile.zim2xapi

import com.ustadmobile.zim2xapi.utils.FileConstants
import java.io.File
import java.net.URLDecoder

class FixExtractZimExceptionsUseCase {

    operator fun invoke(
        zimFolder: File
    ) {

        val exceptionsFolder = File(zimFolder, FileConstants.EXCEPTIONS_FOLDER)

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
        if (exceptionsFolder.listFiles()?.isNotEmpty() == true) {
            throw Exception("Cannot proceed: There are unprocessed files in the exceptions folder")
        } else {
            if (!exceptionsFolder.delete()) {
                throw Exception("Failed to delete the exceptions folder: ${exceptionsFolder.absolutePath}. Check if the folder is empty and accessible.")
            }
        }
    }

}