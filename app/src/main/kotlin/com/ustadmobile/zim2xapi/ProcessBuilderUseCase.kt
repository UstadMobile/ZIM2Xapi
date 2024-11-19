package com.ustadmobile.zim2xapi

class ProcessBuilderUseCase(private val cmdPath: List<String>) {

    operator fun invoke(
        params: String,
        printOutput: Boolean = true
    ): String {
        val commandList = buildList {
            addAll(cmdPath)
            addAll(params.split(whiteSpaceRegex.toRegex()))
        }
        val outputBuilder = StringBuilder()

        val process = ProcessBuilder(commandList)
            .redirectErrorStream(true)
            .start()

        process.inputStream.bufferedReader().use {
            it.lines().forEach { line ->
                if(printOutput) println(line) // Print each line
                outputBuilder.append(line).append("\n")
            }
        }
        val exitCode =  process.waitFor()

        if (exitCode != 0) {
            throw RuntimeException(
                "Process failed with exit code $exitCode\n" +
                        "for command ${commandList.joinToString(" ")}" +
                        "Stdout:\n${outputBuilder}\n"
            )
        }

        return outputBuilder.toString()
    }

    companion object {

        private const val whiteSpaceRegex = "\\s+"

    }
}