package com.ustadmobile.zim2xapi

import com.ustadmobile.zim2xapi.models.ActivityDefinition
import com.ustadmobile.zim2xapi.models.XapiObject
import com.ustadmobile.zim2xapi.utils.FileConstants.INDEX_HTML_FILE
import kotlinx.serialization.json.Json
import org.jsoup.Jsoup
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.PrintWriter
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class CreateXapiFileUseCase(
    private val zimDumpProcess: ProcessBuilderUseCase,
    private val addXApi: AddxAPIStatementUseCase,
    private val json: Json
) {

    operator fun invoke(
        zimFolder: File,
        outputFolder: File,
        fileName: String,
        zimFile: File,
        passingGrade: Int
    ): File {

        val indexHtml = File(zimFolder, INDEX_HTML_FILE)
        val doc = Jsoup.parse(indexHtml, "UTF-8")
        val title = doc.title()
        val description = doc.select("meta[name=description]").attr("content")
        val lang = doc.select("html").attr("lang")

        val output = zimDumpProcess.invoke("info ${zimFile.absolutePath}")
        val uuidLine = output.lines().find { it.trim().startsWith("uuid:") }
        val uuid = uuidLine?.split(":")?.get(1)?.trim()
            ?: throw Exception("uuid not provided by zimdump")

        val activityId = "https://ustadmobile.com/ns/zim2xapi/$uuid"
        val tinCanFile = File(zimFolder, TINCAN_XML)
        PrintWriter(tinCanFile).use { writer ->
            writer.println(
                """<?xml version="1.0" encoding="UTF-8"?>
           <tincan xmlns="http://projecttincan.com/tincan.xsd">
                <activities>
                    <activity id="$activityId" type="$ACTIVITY_TYPE">
                        <name>$title</name>
                        <description lang="$lang">$description</description>
                        <launch lang="$lang">$INDEX_HTML_FILE</launch>
                    </activity>
                </activities>
            </tincan>
        """.trimIndent()
            )
        }

        val xapiObjectJsonFile = File(zimFolder, "xapiobject.json")
        xapiObjectJsonFile.writeText(
            json.encodeToString(
                XapiObject.serializer(), XapiObject(
                    id = activityId,
                    definition = ActivityDefinition(
                        name = mapOf(lang to title),
                        description = mapOf(lang to description),
                        type = ACTIVITY_TYPE
                    )
                )
            )
        )

        addXApi.invoke(zimFolder, passingGrade)

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

        return xapiFile
    }

    companion object {

        const val TINCAN_XML = "tincan.xml"

        const val ACTIVITY_TYPE = "http://adlnet.gov/expapi/activities/module"

    }


}
