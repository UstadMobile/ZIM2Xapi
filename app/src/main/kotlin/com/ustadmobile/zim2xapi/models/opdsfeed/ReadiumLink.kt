package com.ustadmobile.zim2xapi.models.opdsfeed

import kotlinx.serialization.Serializable

@Serializable
data class ReadiumLink(
    val href: String,
    val title: String? = null
)
