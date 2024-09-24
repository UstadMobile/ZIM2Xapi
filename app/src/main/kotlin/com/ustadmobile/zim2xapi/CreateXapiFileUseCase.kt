package com.ustadmobile.zim2xapi

import org.jsoup.Jsoup
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.PrintWriter
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class CreateXapiFileUseCase(private val process: ProcessBuilderUseCase) {

    operator fun invoke(
        zimFolder: File,
        outputFolder: File,
        fileName: String,
        zimFile: File
    ) {

        val indexHtml = File(zimFolder, INDEX_HTML)
        val doc = Jsoup.parse(indexHtml, "UTF-8")
        val title = doc.title()
        val description = doc.select("meta[name=description]").attr("content")
        val lang = doc.select("html").attr("lang")

        val output = process.invoke("zimdump","info ${zimFile.absolutePath}")
        val uuidLine = output.lines().find { it.trim().startsWith("uuid:") }
        val uuid = uuidLine?.split(":")?.get(1)?.trim()
            ?: throw Exception("uuid not provided by zimdump")

        val tinCanFile = File(zimFolder, TINCAN_XML)
        PrintWriter(tinCanFile).use { writer ->
            writer.println("""<?xml version="1.0" encoding="UTF-8"?>
           <tincan xmlns="http://projecttincan.com/tincan.xsd">
                <activities>
                    <activity id="https://ustadmobile.com/ns/zim2xapi/$uuid" type="http://adlnet.gov/expapi/activities/module">
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