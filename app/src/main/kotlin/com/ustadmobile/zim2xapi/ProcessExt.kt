package com.ustadmobile.zim2xapi

import java.io.InputStreamReader

fun Process.printBuffer(){
    inputStream.bufferedReader().use { reader ->
        reader.lines().forEach { line ->
            println(line)
        }
    }
}