package com.ustadmobile.zim2xapi.models.opdsfeed

import kotlinx.serialization.Serializable

@Serializable
data class OpdsFeedMetadata(
    val title: String,
    val description: String? = null
)