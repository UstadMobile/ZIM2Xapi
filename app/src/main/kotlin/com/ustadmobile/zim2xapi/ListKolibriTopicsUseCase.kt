package com.ustadmobile.zim2xapi

import com.ustadmobile.zim2xapi.models.Topic
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException

class ListKolibriTopicsUseCase(
    private val client: OkHttpClient,
    private val json: Json
) {

    operator fun invoke(
        channelId: String,
        endpoints: List<String>
    ) {
        val topic = fetchTopic(channelId, endpoints)
        displayTopicInfo(topic)
    }

    operator fun invoke(
        channelId: String,
        topicId: String,
        endpoints: List<String>
    ): List<Topic> {
        val rootTopic = fetchTopic(topicId, endpoints)

        val allTopics = mutableListOf<Topic>()

        rootTopic.children?.results?.forEach { child ->
            flattenTopics(child, allTopics)
        }

        return allTopics
    }

    private fun displayTopicInfo(topic: Topic, depth: Int = 0) {
        val indent = "  ".repeat(depth)
        println("$indent- ${topic.title} (ID: ${topic.id}, Kind: ${topic.kind}, Leaf: ${topic.is_leaf})")

        topic.children?.results?.forEach { child ->
            displayTopicInfo(child, depth + 1)
        }
    }
    private fun flattenTopics(topic: Topic, list: MutableList<Topic>) {
        list.add(topic)
        topic.children?.results?.forEach { child ->
            flattenTopics(child, list)
        }
    }
    private fun fetchTopic(id: String, endpoints: List<String>): Topic {
        // expecting one url to throw a 404 or an error
        endpoints.forEach {base ->
            val request = Request.Builder()
                .url("$base/api/content/contentnode_tree/$id/?include_coach_content=false")
                .get()
                .build()

            try {
                client.newCall(request).execute().use { response ->
                    val responseData = response.body?.string() ?: return@forEach
                    return json.decodeFromString(responseData)
                }
            }catch (e: Exception){
                return@forEach
            }
        }
        throw IOException("unable to find data on topic")
    }

}