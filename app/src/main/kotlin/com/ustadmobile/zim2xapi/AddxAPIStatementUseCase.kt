package com.ustadmobile.zim2xapi

import org.jsoup.Jsoup
import java.io.File

class AddxAPIStatementUseCase {

    operator fun invoke(
        zimFolder: File
    ) {

        val perseusFile = File(zimFolder, "/assets/perseus/perseus_script.js")

        // if doesn't exist, presume not a khan exercise
        if (!perseusFile.exists()) return

        val indexFile = File(zimFolder, "index.html")

        val indexDoc = Jsoup.parse(indexFile)
        val script = indexDoc.createElement("script")
        script.attr("src", "/assets/perseus/score-tracker.js")
        indexDoc.body().appendChild(script)

        indexFile.writeText(indexDoc.html())

        val scoreFile = File(zimFolder, "/assets/perseus/score-tracker.js")
        val scoreText = this::class.java.classLoader.getResource("score-tracker.js")?.readText() ?: ""
        scoreFile.writeText(scoreText)

        val originalJS = perseusFile.readText()

        val xapiText = "window.vueApp = vueApp;"

        val vueAppEndIndex = originalJS.lastIndexOf("})") + 2

        val modifiedJS =
            originalJS.substring(0, vueAppEndIndex) + "\n\n" + xapiText + "\n" + originalJS.substring(vueAppEndIndex)

        perseusFile.writeText(modifiedJS)
    }

}