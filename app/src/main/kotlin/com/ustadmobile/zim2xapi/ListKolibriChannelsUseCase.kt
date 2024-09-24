package com.ustadmobile.zim2xapi

import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException

class ListKolibriChannelsUseCase(
    private val client: OkHttpClient,
    private val json: Json
) {

    operator fun invoke(endpoints: List<String>) {

        endpoints.forEach { base ->
            val request = Request.Builder()
                .url("$base/api/content/contentnode/?max_results=1")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) throw IOException("Unexpected code $response")

                val responseData = response.body?.string()

                if (responseData != null) {
                    val parsedData: KolibriChannel = json.decodeFromString(responseData)

                    parsedData.labels.channels.forEach {
                        println("${it.name} with id ${it.id}")
                    }
                }
            }
        }
    }
}