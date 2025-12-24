package com.ustadmobile.zim2xapi.models.opdsfeed

import kotlinx.serialization.Serializable

@Serializable
data class ReadiumMetadata(
    val title: String,
    val description: String? = null
)