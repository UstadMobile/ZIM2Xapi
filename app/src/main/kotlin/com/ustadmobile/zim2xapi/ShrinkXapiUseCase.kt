package com.ustadmobile.zim2xapi

import org.jsoup.Jsoup
import java.io.File
import java.io.FileNotFoundException
import java.io.IOException

class ShrinkXapiUseCase {

    operator fun invoke(
        zimFolder: File
    ) {

        val indexHtml = File(zimFolder, INDEX_FILE)
        if (!indexHtml.exists()) throw FileNotFoundException("index html not created")
        val assetsFolder = File(zimFolder, ASSETS_FOLDER)
        if (!assetsFolder.exists()) throw FileNotFoundException("assets html not found")

        val document = Jsoup.parse(indexHtml, "UTF-8")

        val referencedPaths =
            document.select("[href], [src]").map { it.attr("href") + it.attr("src") }.filter { it.isNotBlank() }

        SUBFOLDERS.forEach { subfolder ->
            val subfolderFile = File(assetsFolder, subfolder)
            val isReferenced = referencedPaths.any { it.contains(subfolder, ignoreCase = true) }

            if (!isReferenced) {
                // Delete subfolder if not referenced
                deleteFolderIfExists(subfolderFile)
            }
        }
    }

    private fun deleteFolderIfExists(folder: File) {
        if (folder.exists() && folder.isDirectory) {
            val foldedDeleted = folder.deleteRecursively()
            if (!foldedDeleted) throw IOException("attempt to delete folder ${folder.name} failed")
        } else {
            throw FileNotFoundException("attempt to delete folder ${folder.name} failed: not found")
        }
    }

    companion object {

        const val INDEX_FILE = "index.html"
        const val VIDEOJS_FOLDER = "videojs"
        const val PERSEUS_FOLDER = "perseus"
        const val OGVJS_FOLDER = "ogvjs"
        const val PDFJS_FOLDER = "pdfjs"
        const val BOOTSTRAP_FOLDER = "bootstrap"
        const val BOOTSTRAP_ICONS_FOLDER = "bootstrap-icons"

        const val ASSETS_FOLDER = "assets"

        val SUBFOLDERS = listOf(
            BOOTSTRAP_FOLDER, BOOTSTRAP_ICONS_FOLDER,
            OGVJS_FOLDER, PDFJS_FOLDER, PERSEUS_FOLDER, VIDEOJS_FOLDER
        )


    }

}