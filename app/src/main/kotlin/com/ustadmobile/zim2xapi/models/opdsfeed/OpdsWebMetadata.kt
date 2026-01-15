package com.ustadmobile.zim2xapi.models.opdsfeed

import kotlinx.serialization.Serializable

@Serializable
data class OpdsWebMetadata(
    val type: String? = null,
    val title: String,
    val author: String? = null,
    val identifier: String,
    val language: String? = null,
    val modified: String? = null,
    val description: String? = null
)