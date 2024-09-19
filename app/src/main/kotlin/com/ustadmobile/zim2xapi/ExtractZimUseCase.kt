package com.ustadmobile.zim2xapi

import java.io.File

class ExtractZimUseCase(
    val zimFile: File,
    val output: File
) {

    operator fun invoke() {
        try {
            // run zimDump to extract everything in the zim
            val zimDumpCommand = buildList {
                add("zimdump")
                add("dump")
                // Specify the directory where the dump output will be written
                add("--dir=${output.absolutePath}")
                // The ZIM file to be dumped
                add(zimFile.absolutePath)
            }

            val process2 = ProcessBuilder(zimDumpCommand).directory(output).start()
            process2.printBuffer()
            process2.waitFor()

        }catch (e: Exception){
            println("Stack: ${e.stackTrace}")
            println("Error: ${e.message}")
        }
    }

}