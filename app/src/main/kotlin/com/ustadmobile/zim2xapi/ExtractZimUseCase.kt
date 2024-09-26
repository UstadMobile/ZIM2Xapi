package com.ustadmobile.zim2xapi

import java.io.File

class ExtractZimUseCase(private val zimDumpProcess: ProcessBuilderUseCase) {

    operator fun invoke(
        zimFile: File,
        output: File
    ) {
        zimDumpProcess.invoke(
            "dump --dir=${output.absolutePath} ${zimFile.absolutePath}"
        )
    }
}