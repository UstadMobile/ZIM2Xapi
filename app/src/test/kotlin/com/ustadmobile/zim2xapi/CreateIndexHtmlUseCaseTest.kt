package com.ustadmobile.zim2xapi

import com.ustadmobile.zim2xapi.utils.FileConstants
import io.mockk.every
import io.mockk.mockk
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

class CreateIndexHtmlUseCaseTest {

    private val zimDumpProcess = mockk<ProcessBuilderUseCase>(relaxed = true)
    private val createIndexHtmlUseCase = CreateIndexHtmlUseCase(zimDumpProcess)

    private lateinit var zimFolder: File

    @Before
    fun setup(){
        zimFolder = createTemporaryFolder("zimFolder")
    }

    @Test
    fun `invoke should rename main page to index html`() {
        // Arrange
        val mainPageName = "main.html"
        createFileInFolder(zimFolder, mainPageName)

        mockZimDumpProcessMainPage("main page: $mainPageName")

        // Act
        createIndexHtmlUseCase.invoke(zimFile = zimFolder, zimFolder = zimFolder)

        // Assert
        val indexHtmlFile = File(zimFolder, "index.html")
        assertTrue(indexHtmlFile.exists(), "index.html should be created by renaming the main page")
    }

    @Test
    fun `invoke should throw exception if main page is not found`() {
        // Arrange
        val zimFolder = createTemporaryFolder("zimFolder")

        mockZimDumpProcessMainPage("main page: non_existent.html")

        // Act & Assert
        assertFailsWith<Exception>("Zim main page not found in extracted folder") {
            createIndexHtmlUseCase.invoke(zimFile = zimFolder, zimFolder = zimFolder)
        }

    }

    @Test
    fun `invoke should skip renaming if index html already exists`() {
        // Arrange
        val zimFolder = createTemporaryFolder("zimFolder")
        val indexHtmlFile = createFileInFolder(zimFolder, "index.html")

        // Mock the main page (though it shouldn't matter because index.html exists)
        mockZimDumpProcessMainPage("main page: main.html")

        // Act
        createIndexHtmlUseCase.invoke(zimFile = zimFolder, zimFolder = zimFolder)

        // Assert
        assertTrue(indexHtmlFile.exists(), "index.html should still exist")
    }

    @After
    fun cleanUp(){
        cleanupTempDirs(zimFolder)
    }


    private fun createTemporaryFolder(name: String): File {
        return createTempDirectory(name).toFile()
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