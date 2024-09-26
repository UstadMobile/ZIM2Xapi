package com.ustadmobile.zim2xapi

import java.io.File

class AddxAPIStatementUseCase {

    operator fun invoke(
        zimFolder: File
    ) {

        val perseusFile = File(zimFolder, "/assets/perseus/perseus_script.js")

        // if doesn't exist, presume not a khan exercise
        if (!perseusFile.exists()) return

        val originalJS = perseusFile.readText()

        val xapiText = this::class.java.classLoader.getResource("xapi_integration.js")?.readText() ?: ""

        val vueAppEndIndex = originalJS.lastIndexOf("})") + 2

        val modifiedJS =
            originalJS.substring(0, vueAppEndIndex) + "\n\n" + xapiText + "\n" + originalJS.substring(vueAppEndIndex)

        perseusFile.writeText(modifiedJS)
    }

}