package com.ustadmobile.zim2xapi

import org.jsoup.Jsoup
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.PrintWriter
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class CreateXapiFileUseCase {

    operator fun invoke(
        zimFolder: File,
        outputFolder: File,
        fileName: String
    ) {

        val indexHtml = File(zimFolder, INDEX_HTML)
        val doc = Jsoup.parse(indexHtml, "UTF-8")
        val title = doc.title()
        val description = doc.select("meta[name=description]").attr("content")
        val lang = doc.select("html").attr("lang")

        val tinCanFile = File(zimFolder, TINCAN_XML)
        PrintWriter(tinCanFile).use { writer ->
            writer.println("""<?xml version="1.0" encoding="UTF-8"?>
           <tincan xmlns="http://projecttincan.com/tincan.xsd">
                <activities>
                    <activity id="http://id.tincanapi.com/activity/tincan-prototypes/tetris" type="http://activitystrea.ms/schema/1.0/game">
                        <name>$title</name>
                        <description lang="$lang">$description</description>
                        <launch lang="$lang">$INDEX_HTML</launch>
                    </activity>
                </activities>
            </tincan>
        """.trimIndent())
        }

        val xapiFile = File(outputFolder, "$fileName.zip")
        ZipOutputStream(FileOutputStream(xapiFile)).use { zipOut ->
            zimFolder.walk().forEach { file ->
                if (file.isFile) {
                    val relativePath = zimFolder.toPath().relativize(file.toPath()).toString()
                    zipOut.putNextEntry(ZipEntry(relativePath))
                    FileInputStream(file).use { input ->
                        input.copyTo(zipOut)
                    }
                    zipOut.closeEntry()
                }
            }
        }

    }

    companion object {

        const val TINCAN_XML = "tincan.xml"
        const val INDEX_HTML = "index.html"

    }


}