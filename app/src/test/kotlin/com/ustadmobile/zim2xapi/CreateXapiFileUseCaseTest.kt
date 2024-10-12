package com.ustadmobile.zim2xapi

import io.mockk.every
import io.mockk.mockk
import kotlinx.serialization.json.Json
import org.junit.Test
import java.io.File
import java.io.PrintWriter
import kotlin.io.path.createTempDirectory
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class CreateXapiFileUseCaseTest {

    private val zimDumpProcess = mockk<ProcessBuilderUseCase>(relaxed = true)
    private val xapiStatement = AddxAPIStatementUseCase()
    private val createXapiFileUseCase = CreateXapiFileUseCase(zimDumpProcess, xapiStatement, Json)

    @Test
    fun `invoke should create tincan xml and zip file`() {
        val zimFolder = createTemporaryFolder("zimfolder")
        val outputFolder = createTemporaryFolder("outputFolder")
        val zimFile = File(zimFolder, "example.zim")
        zimFile.createNewFile() // Create an empty zimFile to simulate input

        createIndexHtml(zimFolder, title = "Sample Title", description = "Sample Description", lang = "en")

        mockZimDumpProcess("uuid: 123e4567-e89b-12d3-a456-426614174000")

        val fileName = "outputFile"
        createXapiFileUseCase.invoke(zimFolder, outputFolder, fileName, zimFile, 50)

        val tinCanFile = File(zimFolder, "tincan.xml")
        assertTrue(tinCanFile.exists(), "tincan.xml file should be created")

        val tinCanContent = tinCanFile.readText()
        assertTrue(tinCanContent.contains("<name>Sample Title</name>"), "tincan.xml should contain the title")
        assertTrue(tinCanContent.contains("<description lang=\"en\">Sample Description</description>"), "tincan.xml should contain the description")
        assertTrue(tinCanContent.contains("activity id=\"https://ustadmobile.com/ns/zim2xapi/123e4567-e89b-12d3-a456-426614174000\""),
            "tincan.xml should contain the correct activity ID")

        val zipFile = File(outputFolder, "$fileName.zip")
        assertTrue(zipFile.exists(), "ZIP file should be created")

        cleanupTempDirs(zimFolder, outputFolder)
    }

    @Test
    fun `invoke should throw exception when index html is missing`() {
        // Arrange
        val zimFolder = createTemporaryFolder("zimFolder")
        val outputFolder = createTemporaryFolder("outputFolder")
        val zimFile = File(zimFolder, "example.zim")
        zimFile.createNewFile() // Create an empty zimFile to simulate input

        // Mock the zimDumpProcess to provide a UUID
        mockZimDumpProcess("uuid: 123e4567-e89b-12d3-a456-426614174000")

        // Act & Assert
        val exception = assertFailsWith<Exception> {
            createXapiFileUseCase.invoke(zimFolder, outputFolder, "outputFile", zimFile, 50)
        }
        assertTrue(exception.message?.contains("index.html") == true, "Expected an exception regarding missing index.html")

        // Cleanup
        cleanupTempDirs(zimFolder, outputFolder)
    }

    @Test
    fun `invoke should throw exception when uuid is missing from zimDumpProcess output`() {
        // Arrange
        val zimFolder = createTemporaryFolder("zimFolder")
        val outputFolder = createTemporaryFolder("outputFolder")
        val zimFile = File(zimFolder, "example.zim")
        zimFile.createNewFile()

        // Create index.html with basic information
        val indexHtml = File(zimFolder, "index.html")
        PrintWriter(indexHtml).use { writer ->
            writer.println("<html lang=\"en\"><head><title>Sample Title</title></head></html>")
        }

        // Mock the zimDumpProcess without providing a UUID
        mockZimDumpProcess("some unrelated info")

        // Act & Assert
        val exception = assertFailsWith<Exception> {
            createXapiFileUseCase.invoke(zimFolder, outputFolder, "outputFile", zimFile, 50)
        }
        assertTrue(exception.message?.contains("uuid not provided by zimdump") == true)

        // Cleanup
        cleanupTempDirs(zimFolder, outputFolder)
    }


    private fun createTemporaryFolder(name: String): File {
        return createTempDirectory(name).toFile()
    }

    // Mock the zimDumpProcess to return a UUID
    private fun mockZimDumpProcess(uuid: String) {
        every { zimDumpProcess.invoke(any()) } returns uuid
    }


    // Create an index.html file in the zim folder
    private fun createIndexHtml(zimFolder: File, title: String, description: String, lang: String) {
        val indexHtml = File(zimFolder, "index.html")
        PrintWriter(indexHtml).use { writer ->
            writer.println("""
                <html lang="$lang">
                <head>
                    <title>$title</title>
                    <meta name="description" content="$description"/>
                </head>
                <body></body>
                </html>
            """.trimIndent())
        }
    }

    // Cleanup temporary directories
    private fun cleanupTempDirs(vararg dirs: File) {
        dirs.forEach { it.deleteRecursively() }
    }


}