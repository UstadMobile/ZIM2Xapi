package com.ustadmobile.zim2xapi

import com.ustadmobile.zim2xapi.utils.FileConstants
import org.junit.After
import org.junit.Before
import org.junit.Test
import java.io.File
import java.io.PrintWriter
import java.net.URLEncoder
import kotlin.io.path.createTempDirectory
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class FixExtractZimExceptionsUseCaseTest {

    private val fixExtractZimExceptionsUseCase = FixExtractZimExceptionsUseCase()

    private lateinit var zimFolder: File

    @Before
    fun setup(){
        zimFolder = createTempDirectory("zimFolder").toFile()
    }

    @Test
    fun `invoke should handle non-UTF-8 encoded file names`() {
        // Arrange
        val exceptionsFolder = File(zimFolder, FileConstants.EXCEPTIONS_FOLDER)
        exceptionsFolder.mkdirs()

        // Create an exception file with special characters
        val encodedFileName = URLEncoder.encode("excéption特殊.html", "UTF-8")
        createFileInFolder(exceptionsFolder, encodedFileName)

        // Act
        fixExtractZimExceptionsUseCase.invoke(zimFolder = zimFolder)

        // Assert
        val movedExceptionFile = File(zimFolder, "excéption特殊.html")
        assertTrue(movedExceptionFile.exists(), "Exception file with special characters should be moved to the zimFolder")

        // Check if `_exceptions` folder is removed
        assertFalse(exceptionsFolder.exists(), "_exceptions folder should be deleted")
    }

    @Test
    fun `invoke should remove exceptions folder if all files moved successfully`() {
        // Arrange
        val exceptionsFolder = File(zimFolder, FileConstants.EXCEPTIONS_FOLDER)
        exceptionsFolder.mkdirs()
        createFileInFolder(exceptionsFolder, "movable_file.html")

        // Act
        fixExtractZimExceptionsUseCase.invoke(zimFolder = zimFolder)

        // Assert
        assertFalse(exceptionsFolder.exists(), "_exceptions folder should be deleted after all files are moved")
    }


    @After
    fun cleanUp(){
        zimFolder.deleteRecursively()
    }

    private fun createFileInFolder(folder: File, fileName: String): File {
        val file = File(folder, fileName)
        PrintWriter(file).use { writer ->
            writer.println("Sample content")
        }
        return file
    }



}