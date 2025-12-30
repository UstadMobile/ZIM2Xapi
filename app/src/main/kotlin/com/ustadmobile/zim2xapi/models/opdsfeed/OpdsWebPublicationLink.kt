package com.ustadmobile.zim2xapi.models.opdsfeed

import kotlinx.serialization.Serializable

@Serializable
data class OpdsWebPublicationLink(
    val href: String,
    val type: String,
    val rel: String? = null,
    val title: String? = null,
    val height: Int? = null,
    val width: Int? = null,
    val templated: Boolean? = null
)