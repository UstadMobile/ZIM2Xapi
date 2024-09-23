package com.ustadmobile.zim2xapi

import java.io.File

class ExtractZimUseCase(private val process: ProcessBuilderUseCase) {

    operator fun invoke(
        zimFile: File,
        output: File
    ) {
        process.invoke(
            "zimdump",
            "dump --dir=${output.absolutePath} ${zimFile.absolutePath}"
        )
    }
}