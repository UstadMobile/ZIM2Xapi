package com.ustadmobile.zim2xapi

import com.ustadmobile.zim2xapi.models.ActivityDefinition
import com.ustadmobile.zim2xapi.models.XapiObject
import com.ustadmobile.zim2xapi.models.opdsfeed.OpdsFeed
import com.ustadmobile.zim2xapi.models.opdsfeed.OpdsFeedMetadata
import com.ustadmobile.zim2xapi.models.opdsfeed.OpdsWebMetadata
import com.ustadmobile.zim2xapi.models.opdsfeed.ReadiumLink
import com.ustadmobile.zim2xapi.models.opdsfeed.OpdsWebPublication
import com.ustadmobile.zim2xapi.models.opdsfeed.OpdsWebPublicationLink
import java.net.URI
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

        val indexHtml = File(zimFolder, INDEX_HTML)
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
                        <launch lang="$lang">$INDEX_HTML</launch>
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

        val path = zimFolder.absolutePath.toString()
        val topic = path.split("/").last()
        val assetResources = generateResourceLinks(zimFolder, topic)

        val opdsWebPublication = File(zimFolder, PUBLICATION_JSON)
        opdsWebPublication.writeText(
            json.encodeToString(
                OpdsWebPublication.serializer(), OpdsWebPublication(
                    context = "",
                    metadata = OpdsWebMetadata(
                        title = title,
                        description = description,
                        identifier = "/$topic"
                    ),
                    links = listOf(
                        OpdsWebPublicationLink(
                            rel = SELF_LINK,
                            href = "/$topic/$INDEX_HTML"
                        ),
                        OpdsWebPublicationLink(
                            rel = ACQUISITION_LINK,
                            href = "/$topic/$INDEX_HTML"
                        )
                    ),
                    resources = assetResources
                )
            )
        )

        val opdsFeedJsonFile = File(zimFolder, OPDS_JSON)
        opdsFeedJsonFile.writeText(
            json.encodeToString(
                OpdsFeed.serializer(), OpdsFeed(
                    metadata = OpdsFeedMetadata(
                        title = title,
                        description = description
                    ),
                    links = listOf(
                        ReadiumLink(
                            href = "/$topic/$OPDS_JSON",
                            title = title,
                        )
                    ),
                    navigation = listOf(
                        ReadiumLink(
                            href = "/$topic/$PUBLICATION_JSON",
                            title = title
                        )
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

    private fun generateResourceLinks(
        zimFolder: File,
        topic: String
    ): List<OpdsWebPublicationLink> {
        val assetsFolder = File(zimFolder, ASSESTS)
        if (!assetsFolder.exists() || !assetsFolder.isDirectory) return emptyList()

        return assetsFolder.walk()
            .filter { it.isFile }
            .map { file ->
                val relativePath = zimFolder.toPath().relativize(file.toPath()).toString()
                OpdsWebPublicationLink(
                    href = "/$topic/$relativePath",
                )
            }
            .toList()
    }

    companion object {

        const val TINCAN_XML = "tincan.xml"
        const val INDEX_HTML = "index.html"

        const val OPDS_JSON = "opds.json"
        const val PUBLICATION_JSON = "publication.json"

        const val ASSESTS = "assets"

        const val SELF_LINK = "self"
        const val ACQUISITION_LINK = "http://opds-spec.org/acquisition/open-access"

        const val ACTIVITY_TYPE = "http://adlnet.gov/expapi/activities/module"

    }


}
