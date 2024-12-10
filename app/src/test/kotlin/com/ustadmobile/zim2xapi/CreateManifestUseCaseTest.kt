package com.ustadmobile.zim2xapi

import org.jsoup.Jsoup
import org.junit.Before
import org.junit.Test
import java.io.File
import kotlin.io.path.createTempDirectory
import kotlin.test.assertTrue

class CreateManifestUseCaseTest {

    private val createManifestUseCase = CreateManifestFileUseCase()

    private lateinit var zimFolder: File

    @Before
    fun setup(){
        zimFolder = createTemporaryFolder("zimFolder")
    }


    @Test
    fun `test generate manifest`() {
        val assetsFolder = File(zimFolder, "assets")
        assetsFolder.mkdirs()

        val videoFolder = File(assetsFolder, "video")
        videoFolder.mkdirs()

        File(assetsFolder, "script.js").writeText("console.log('Hello World')")
        File(videoFolder, "style.css").writeText("body { color: red; }")

        val indexHtmlFile = File(zimFolder, "index.html")
        indexHtmlFile.writeText("""
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>My Web App</title>
            </head>
            <body>
                <h1>Welcome to my Web App</h1>
            </body>
            </html>
        """.trimIndent())


        val manifestFile = createManifestUseCase(zimFolder)

        assertTrue(manifestFile.exists())

        val expectedPaths = listOf(
            "assets/script.js",
            "assets/video/style.css",
            "index.html"
        )

        val actualLines = manifestFile.readLines()

        assertTrue(actualLines.containsAll(expectedPaths))

        val updatedDoc = Jsoup.parse(indexHtmlFile, "UTF-8")
        val linkElement = updatedDoc.select("link[rel=manifest]").first()

        assertTrue(linkElement != null, "Manifest link tag should exist")
        assertTrue(linkElement.attr("href") == "manifest.txt", "Manifest link href should be manifest.txt")

    }
    private fun createTemporaryFolder(name: String): File {
        return createTempDirectory(name).toFile()
    }




}