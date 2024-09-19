package com.ustadmobile.zim2xapi

import java.io.File
import java.nio.file.Files
import java.nio.file.StandardCopyOption

val mimeExtensionMap = mapOf(
    "text/html" to ".html",
    "image/jpeg" to ".jpg",
    "image/png" to ".png",
    "text/plain" to ".txt",
    "application/pdf" to ".pdf",
    "application/javascript" to ".js",
    "text/css" to ".css"
)

fun isWindowsOs(osName: String = System.getProperty("os.name") ?: ""): Boolean {
    return osName.lowercase().contains("win")
}

fun isLinuxOs(osName: String = System.getProperty("os.name") ?: ""): Boolean {
    return osName.lowercase().let { it.contains("linux") || it.contains("nix") }
}

fun File.getMimeType(): String? {
    return Files.probeContentType(toPath())
}

fun File.renameFileBasedOnMimeType(mimeType: String? = getMimeType()) {
    if (mimeType == null) {
        println("Could not determine MIME type for file: $name")
        return
    }

    // Get the appropriate extension based on the MIME type
    val extension = mimeExtensionMap[mimeType]
    if (extension != null) {
        val newFileName = absolutePath + extension
        val newFile = File(newFileName)

        // Rename the file
        Files.move(toPath(), newFile.toPath(), StandardCopyOption.REPLACE_EXISTING)
        println("Renamed $name to ${newFile.name}")
    } else {
        println("No known extension for MIME type: $mimeType for file: $name")
    }
}

/**
 * Find a file that implements a command for the receiver's name. On Unix/Linux, this is simple, it
 * is just the file itself (if it exists).
 *
 * If in Windows, we need to look for the file with a .exe or .bat extension
 */
fun File.getCommandFile(
    osName: String = System.getProperty("os.name") ?: ""
): File? {
    val isWin = isWindowsOs(osName)
    return when {
        exists() -> this
        isWin && File(parent,"$name.exe").exists() -> File(parent,"$name.exe")
        isWin && File(parent, "$name.bat").exists() -> File(parent,"$name.bat")
        else -> null
    }
}