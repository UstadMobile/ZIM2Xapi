package com.ustadmobile.zim2xapi

import com.ustadmobile.zim2xapi.utils.FileConstants
import org.jsoup.nodes.Document
import org.junit.After
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.io.FileNotFoundException
import kotlin.io.path.createTempDirectory

class ShrinkXapiUseCaseTest {

    private val shrinkXapiUseCase = ShrinkXapiUseCase()

    val zimFolder: File = createTemporaryFolder("zimfolder")

    private fun setupTestEnvironment(referencedAssets: List<String>) {
        // Create `index.html` file
        val indexHtmlFile = File(zimFolder, FileConstants.INDEX_HTML_FILE)
        val document = Document("")
        referencedAssets.forEach {
            document.body().appendElement("a").attr("href", "assets/$it")
        }
        indexHtmlFile.writeText(document.outerHtml())

        // Create assets subfolders and files
        val assetsFolder = File(zimFolder, FileConstants.ASSETS_FOLDER)
        assetsFolder.mkdirs()
        ShrinkXapiUseCase.SUBFOLDERS.forEach {
            File(assetsFolder, it).mkdir()
        }
    }

    @Test
    fun `should throw FileNotFoundException when index html does not exist`() {
        assertThrows(FileNotFoundException::class.java) {
            shrinkXapiUseCase.invoke(zimFolder)
        }
    }

    @Test
    fun `should throw FileNotFoundException when assets folder does not exist`() {
        val indexHtmlFile = File(zimFolder, FileConstants.INDEX_HTML_FILE)
        indexHtmlFile.writeText("<html><body></body></html>")

        assertThrows(FileNotFoundException::class.java) {
            shrinkXapiUseCase.invoke(zimFolder)
        }
    }


    @Test
    fun `should delete unreferenced subfolders`() {
        // Setup environment with some referenced assets
        setupTestEnvironment(referencedAssets = listOf("bootstrap", "pdfjs"))

        shrinkXapiUseCase.invoke(zimFolder)

        // Assert that referenced folders are still present
        val assetsFolder = File(zimFolder, FileConstants.ASSETS_FOLDER)
        assertTrue(File(assetsFolder, "bootstrap").exists())
        assertTrue(File(assetsFolder, "pdfjs").exists())

        // Assert that unreferenced folders are deleted
        assertFalse(File(assetsFolder, "videojs").exists())
        assertFalse(File(assetsFolder, "perseus").exists())
        assertFalse(File(assetsFolder, "ogvjs").exists())
        assertFalse(File(assetsFolder, "bootstrap-icons").exists())
    }

    @Test
    fun `should not delete referenced subfolders`() {
        // Setup environment with all assets referenced
        setupTestEnvironment(referencedAssets = ShrinkXapiUseCase.SUBFOLDERS)

        shrinkXapiUseCase.invoke(zimFolder)

        // Assert that all subfolders are still present
        val assetsFolder = File(zimFolder, FileConstants.ASSETS_FOLDER)
        ShrinkXapiUseCase.SUBFOLDERS.forEach { subfolder ->
            assertTrue(File(assetsFolder, subfolder).exists())
        }
    }

    @After
    fun deleteTempDir(){
        zimFolder.deleteRecursively()
    }

    private fun createTemporaryFolder(name: String): File {
        return createTempDirectory(name).toFile()
    }

}