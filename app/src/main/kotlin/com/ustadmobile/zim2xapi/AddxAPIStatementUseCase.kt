package com.ustadmobile.zim2xapi

import org.jsoup.Jsoup
import java.io.File

class AddxAPIStatementUseCase {

    operator fun invoke(
        zimFolder: File,
        passingGrade: Int
    ) {

        val perseusFile = File(zimFolder, "/assets/perseus/perseus_script.js")

        // if doesn't exist, presume not a khan exercise
        if (!perseusFile.exists()) return

        val indexFile = File(zimFolder, "index.html")

        val indexDoc = Jsoup.parse(indexFile)
        val scoreScript = indexDoc.createElement("script")
        scoreScript.attr("src", "/assets/perseus/score-tracker.js")
            .attr("type", "module")
        val widgetsScript = indexDoc.createElement("script")
        widgetsScript.attr("src", "/assets/perseus/khan-widgets.js")
            .attr("type", "module")
        indexDoc.body().appendChild(scoreScript).appendChild(widgetsScript)

        indexFile.writeText(indexDoc.html())

        val passingGradeDeclaration = "const passingGrade = $passingGrade;\n"
        val scoreFile = File(zimFolder, "/assets/perseus/score-tracker.js")
        val scoreText = this::class.java.classLoader.getResource("score-tracker.js")?.readText() ?: ""
        scoreFile.writeText(passingGradeDeclaration + scoreText)

        val widgetsFile = File(zimFolder, "/assets/perseus/khan-widgets.js")
        val widgetsText = this::class.java.classLoader.getResource("khan-widgets.js")?.readText() ?: ""
        widgetsFile.writeText(widgetsText)

        val originalJS = perseusFile.readText()
        val xapiText = "window.vueApp = vueApp;"
        perseusFile.writeText(originalJS + xapiText)
    }

}