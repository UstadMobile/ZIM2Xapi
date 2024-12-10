package com.ustadmobile.zim2xapi

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
        File(zimFolder, "index.html").writeText("<html></html>")


        val manifestFile = createManifestUseCase(zimFolder)

        assertTrue(manifestFile.exists())

        val expectedPaths = listOf(
            "assets/script.js",
            "assets/video/style.css",
            "index.html"
        )

        val actualLines = manifestFile.readLines()

        assertTrue(actualLines.containsAll(expectedPaths))

    }









    private fun createTemporaryFolder(name: String): File {
        return createTempDirectory(name).toFile()
    }




}