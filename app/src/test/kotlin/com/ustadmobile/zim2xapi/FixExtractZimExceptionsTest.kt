package com.ustadmobile.zim2xapi

import io.mockk.every
import io.mockk.mockk
import org.junit.Test
import java.io.File
import java.io.PrintWriter
import java.net.URLEncoder
import kotlin.io.path.createTempDirectory
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class FixExtractZimExceptionsTest {

    private val zimDumpProcess = mockk<ProcessBuilderUseCase>(relaxed = true)
    private val fixExtractZimExceptions = FixExtractZimExceptionsUseCase(zimDumpProcess)

    @Test
    fun `invoke should rename main page to index html and move exceptions`() {
        // Arrange
        val zimFolder = createTemporaryFolder("zimFolder")
        val exceptionsFolder = createExceptionsFolder(zimFolder)
        val mainPageName = "main.html"
        val mainPageFile = createFileInFolder(zimFolder, mainPageName)
        val exceptionFile = createFileInFolder(exceptionsFolder, URLEncoder.encode("exception.html", "UTF-8"))

        mockZimDumpProcessMainPage("main page: $mainPageName")

        // Act
        fixExtractZimExceptions.invoke(zimFile = zimFolder, zimFolder = zimFolder)

        // Assert
        val indexHtmlFile = File(zimFolder, "index.html")
        assertTrue(indexHtmlFile.exists(), "index.html should be created by renaming the main page")

        val movedExceptionFile = File(zimFolder, "exception.html")
        assertTrue(movedExceptionFile.exists(), "Exception file should be moved to the zimFolder")

        // Check if `_exceptions` folder is removed
        assertFalse(exceptionsFolder.exists(), "_exceptions folder should be deleted")

        // Cleanup
        cleanupTempDirs(zimFolder)
    }

    @Test
    fun `invoke should throw exception if main page is not found`() {
        // Arrange
        val zimFolder = createTemporaryFolder("zimFolder")
        val exceptionsFolder = createExceptionsFolder(zimFolder)
        createFileInFolder(exceptionsFolder, URLEncoder.encode("exception.html", "UTF-8"))

        mockZimDumpProcessMainPage("main page: non_existent.html")

        // Act & Assert
        assertFailsWith<Exception>("Zim main page not found in extracted folder") {
            fixExtractZimExceptions.invoke(zimFile = zimFolder, zimFolder = zimFolder)
        }

        // Cleanup
        cleanupTempDirs(zimFolder)
    }

    @Test
    fun `invoke should do nothing if exceptions folder does not exist`() {
        // Arrange
        val zimFolder = createTemporaryFolder("zimFolder")
        val mainPageName = "main.html"
        val mainPageFile = createFileInFolder(zimFolder, mainPageName)

        // Record the last modified time to ensure no changes are made
        val initialLastModified = mainPageFile.lastModified()

        // Mock zimDumpProcess to provide main page as "main.html"
        mockZimDumpProcessMainPage("main page: $mainPageName")

        // Act
        fixExtractZimExceptions.invoke(zimFile = zimFolder, zimFolder = zimFolder)

        // Assert
        // Check that the main page has not been renamed
        assertTrue(mainPageFile.exists(), "main.html should still exist and not be renamed")

        // Ensure that no new `index.html` file has been created
        val indexHtmlFile = File(zimFolder, "index.html")
        assertFalse(indexHtmlFile.exists(), "index.html should not exist since no renaming should have occurred")

        // Ensure that the `_exceptions` folder does not exist
        val exceptionsFolder = File(zimFolder, FixExtractZimExceptionsUseCase.EXCEPTIONS_FOLDER_NAME)
        assertFalse(exceptionsFolder.exists(), "_exceptions folder should not exist")

        // Ensure that the last modified time of the main page has not changed
        assertEquals(initialLastModified, mainPageFile.lastModified(), "main.html file should not be modified")

        // Cleanup
        cleanupTempDirs(zimFolder)
    }

    @Test
    fun `invoke should handle non-UTF-8 encoded file names`() {
        // Arrange
        val zimFolder = createTemporaryFolder("zimFolder")
        val exceptionsFolder = createExceptionsFolder(zimFolder)
        val mainPageName = "main.html"
        createFileInFolder(zimFolder, mainPageName)

        // Create an exception file with special characters
        val encodedFileName = URLEncoder.encode("excéption特殊.html", "UTF-8")
        createFileInFolder(exceptionsFolder, encodedFileName)
        mockZimDumpProcessMainPage("main page: $mainPageName")

        // Act
        fixExtractZimExceptions.invoke(zimFile = zimFolder, zimFolder = zimFolder)

        // Assert
        val movedExceptionFile = File(zimFolder, "excéption特殊.html")
        assertTrue(movedExceptionFile.exists(), "Exception file with special characters should be moved to the zimFolder")

        // Check if `_exceptions` folder is removed
        assertFalse(exceptionsFolder.exists(), "_exceptions folder should be deleted")

        // Cleanup
        cleanupTempDirs(zimFolder)
    }


    private fun createTemporaryFolder(name: String): File {
        return createTempDirectory(name).toFile()
    }

    private fun createExceptionsFolder(zimFolder: File): File {
        val exceptionsFolder = File(zimFolder, FixExtractZimExceptionsUseCase.EXCEPTIONS_FOLDER_NAME)
        exceptionsFolder.mkdirs()
        return exceptionsFolder
    }

    private fun createFileInFolder(folder: File, fileName: String): File {
        val file = File(folder, fileName)
        PrintWriter(file).use { writer ->
            writer.println("Sample content")
        }
        return file
    }

    private fun mockZimDumpProcessMainPage(mainPage: String) {
        every { zimDumpProcess.invoke(any()) } returns mainPage
    }

    private fun cleanupTempDirs(vararg dirs: File) {
        dirs.forEach { it.deleteRecursively() }
    }

}