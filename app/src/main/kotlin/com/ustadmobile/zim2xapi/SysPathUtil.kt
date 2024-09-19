package com.ustadmobile.zim2xapi

import java.io.File


object SysPathUtil {

    private fun findCommandInPath(
        commandName: String,
        manuallySpecifiedLocation: File? = null,
        pathVar: String = System.getenv("PATH") ?: "",
        extraSearchPaths: String = System.getProperty("user.dir") ?: "",
        osName: String = System.getProperty("os.name") ?: "",
        fileSeparator: String = File.pathSeparator,
    ): File? {

        // check if manually specified
        if (manuallySpecifiedLocation?.exists() == true)
            return manuallySpecifiedLocation


        val pathToSearch = buildString {
            append(pathVar)
            if (extraSearchPaths.isNotEmpty()) {
                append(fileSeparator)
                append(extraSearchPaths)
            }
        }

        return pathToSearch.split(fileSeparator).mapNotNull {
            File(it, commandName).getCommandFile(osName)
        }.firstOrNull()
    }

    fun commandExists(
        commandName: String,
        manuallySpecifiedLocation: File? = null,
        pathVar: String = System.getenv("PATH") ?: "",
        extraSearchPaths: String = System.getProperty("user.dir") ?: "",
        osName: String = System.getProperty("os.name") ?: "",
        fileSeparator: String = File.pathSeparator
    ): Boolean {
        return findCommandInPath(
            commandName, manuallySpecifiedLocation, pathVar, extraSearchPaths,
            osName, fileSeparator
        ) != null
    }

}