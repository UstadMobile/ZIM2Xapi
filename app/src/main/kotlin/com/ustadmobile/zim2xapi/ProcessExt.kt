package com.ustadmobile.zim2xapi

fun Process.printBuffer(){
    inputStream.bufferedReader().use { reader ->
        reader.lines().forEach { line ->
            println(line)
        }
    }
}