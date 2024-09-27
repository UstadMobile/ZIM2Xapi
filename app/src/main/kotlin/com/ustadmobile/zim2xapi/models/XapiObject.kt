package com.ustadmobile.zim2xapi.models

import kotlinx.serialization.Serializable

@Serializable
data class XapiObject(
    val id: String,
    val definition: ActivityDefinition
)

@Serializable
data class ActivityDefinition(
    val name: Map<String, String>,
    val description: Map<String, String>,
    val type: String
)