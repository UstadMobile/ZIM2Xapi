package com.ustadmobile.zim2xapi

import com.ustadmobile.zim2xapi.models.ActivityDefinition
import com.ustadmobile.zim2xapi.models.Topic
import com.ustadmobile.zim2xapi.models.XapiObject
import com.ustadmobile.zim2xapi.models.opdsfeed.OpdsFeed
import com.ustadmobile.zim2xapi.models.opdsfeed.OpdsFeedMetadata
import com.ustadmobile.zim2xapi.models.opdsfeed.OpdsWebMetadata
import com.ustadmobile.zim2xapi.models.opdsfeed.ReadiumLink
import com.ustadmobile.zim2xapi.models.opdsfeed.OpdsWebPublication
import com.ustadmobile.zim2xapi.models.opdsfeed.OpdsWebPublicationLink
import kotlinx.serialization.json.Json
import org.jsoup.Jsoup
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.PrintWriter
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import kotlin.reflect.typeOf

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
        passingGrade: Int,
        allTopics: List<Topic>
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

        val xapiObjectJsonFile = File(zimFolder, XAPI_OBJECT_JSON)
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
        val topicId = path.split("/").last()
        val assetResources = generateResourceLinks(zimFolder, topicId)
        
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
                            href = "$topicId/$topicId",
                            title = title,
                        )
                    ),
                    navigation = listOf(
                        ReadiumLink(
                            href = "$topicId/$topicId.json",
                            title = title
                        ),
                    )
                )
            )
        )

        val publicationLinks = allTopics.map { subTopic ->
            OpdsWebPublication(
                links = listOf(
                    OpdsWebPublicationLink(
                        rel = SELF_LINK,
                        href = "$topicId/${subTopic.id}.json"
                    ),
                ),
                context = "",
                metadata = OpdsWebMetadata(
                    title = subTopic.title,
                    description = subTopic.description,
                    identifier = subTopic.id
                ),
            )
        }

        val topicJsonFile = File(zimFolder, "${topicId}.json")
        topicJsonFile.writeText(
            json.encodeToString(
                OpdsFeed.serializer(), OpdsFeed(
                    metadata = OpdsFeedMetadata(
                        title = title,
                        description = description
                    ),
                    links = listOf(
                        ReadiumLink(
                            href = "$topicId/$topicId.json",
                            title = title,
                        )
                    ),
                    publications = publicationLinks
                )
            )
        )

        allTopics.forEach { subTopic ->
            val subTopicJsonFile = File(zimFolder, "${subTopic.id}.json")
            subTopicJsonFile.writeText(
                json.encodeToString(
                    OpdsWebPublication.serializer(),
                    OpdsWebPublication(
                        context = "",
                        metadata = OpdsWebMetadata(
                            title = subTopic.title,
                            description = subTopic.description,
                            identifier = subTopic.id
                        ),
                        links = listOf(
                            OpdsWebPublicationLink(
                                rel = SELF_LINK,
                                href = "$topicId/${subTopic.id}"
                            ),
                            OpdsWebPublicationLink(
                                rel = ACQUISITION_LINK,
                                href = "$topicId/$INDEX_HTML",
                                type = "text/html"
                            )
                        ),
                        resources = assetResources
                    )
                )
            )
        }


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
                    href = "$topic/$relativePath",
                )
            }
            .toList()
    }

    companion object {

        const val TINCAN_XML = "tincan.xml"
        const val INDEX_HTML = "index.html"

        const val XAPI_OBJECT_JSON = "xapiobject.json"
        const val OPDS_JSON = "opds.json"

        const val ASSESTS = "assets"

        const val SELF_LINK = "self"
        const val ACQUISITION_LINK = "http://opds-spec.org/acquisition/open-access"

        const val ACTIVITY_TYPE = "http://adlnet.gov/expapi/activities/module"

    }


}
