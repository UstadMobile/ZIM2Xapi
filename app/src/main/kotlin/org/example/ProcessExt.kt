package org.example

fun Process.printBuffer(){
    inputStream.bufferedReader().use { reader ->
        reader.lines().forEach { line ->
            println(line)
        }
    }
}