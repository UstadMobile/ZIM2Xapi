package com.ustadmobile.zim2xapi

import kotlinx.serialization.Serializable

@Serializable
data class Topic(
    val id: String,
    val channel_id: String,
    val description: String,
    val kind: String,
    val parent: String? = null,
    val title: String,
    val is_leaf: Boolean,
    val children: Children? = null
)

@Serializable
data class Children(
    val results: List<Topic>
)


