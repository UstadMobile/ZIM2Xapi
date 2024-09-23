package com.ustadmobile.zim2xapi

class ProcessBuilderUseCase {

    operator fun invoke(
        command: String,
        params: String
    ): String {
        val commandList = buildList {
            addAll(command.split(whiteSpaceRegex.toRegex()))
            addAll(params.split(whiteSpaceRegex.toRegex()))
        }
        val outputBuilder = StringBuilder()

        val process = ProcessBuilder(commandList)
            .redirectErrorStream(true)
            .start()

        process.inputStream.bufferedReader().use {
            it.lines().forEach { line ->
                println(line) // Print each line
                outputBuilder.append(line).append("\n")
            }
        }
        val exitCode =  process.waitFor()

        if (exitCode != 0) {
            throw RuntimeException("Process failed with exit code $exitCode")
        }

        return outputBuilder.toString()
    }

    companion object {

        private const val whiteSpaceRegex = "\\s+"

    }
}