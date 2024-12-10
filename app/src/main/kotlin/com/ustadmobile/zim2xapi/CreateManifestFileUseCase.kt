package com.ustadmobile.zim2xapi

import com.ustadmobile.zim2xapi.utils.FileConstants
import org.jsoup.Jsoup
import java.io.File

class CreateManifestFileUseCase {

    operator fun invoke(
        zimFolder: File
    ): File {

        val manifestFile = File(zimFolder, MANIFEST_FILE)

        manifestFile.bufferedWriter().use { writer ->
            zimFolder.walkTopDown().filter {
                it.isFile
            }.forEach { file ->
                writer.write(file.relativeTo(zimFolder).path)
                writer.newLine()
            }
        }

        val indexHtmlFile = File(zimFolder, FileConstants.INDEX_HTML_FILE)
        if (indexHtmlFile.exists()) {
            val indexDoc = Jsoup.parse(indexHtmlFile)
            val linkTag = indexDoc.createElement("link")
            linkTag.attr("rel", "manifest")
            linkTag.attr("href", MANIFEST_FILE)
        }


        return manifestFile
    }

    companion object {

        const val MANIFEST_FILE = "manifest.txt"

    }


}