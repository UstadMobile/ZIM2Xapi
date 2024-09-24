package com.ustadmobile.zim2xapi

import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException

class ListKolibriTopicsUseCase(
    private val client: OkHttpClient,
    private val json: Json
) {

    operator fun invoke(
        channelId: String
    ) {
        val topic = fetchTopic(channelId)

        if (topic != null) {
            displayTopicInfo(topic)
        } else {
            throw Exception("No Data found for channel/topic id $channelId")
        }

    }

    fun displayTopicInfo(topic: Topic, depth: Int = 0) {
        val indent = "  ".repeat(depth)
        println("$indent- ${topic.title} (ID: ${topic.id}, Kind: ${topic.kind}, Leaf: ${topic.is_leaf})")

        topic.children?.results?.forEach { child ->
            displayTopicInfo(child, depth + 1)
        }
    }

    private fun fetchTopic(id: String): Topic? {
        val request = Request.Builder()
            .url("https://kolibri-catalog-en.learningequality.org/api/content/contentnode_tree/$id/?include_coach_content=false")
            .get()
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IOException("Unexpected code $response")

            val responseData = response.body?.string() ?: return null
            return json.decodeFromString(responseData)
        }
    }

}