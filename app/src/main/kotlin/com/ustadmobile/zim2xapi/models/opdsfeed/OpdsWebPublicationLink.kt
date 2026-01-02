package com.ustadmobile.zim2xapi.models.opdsfeed

import kotlinx.serialization.Serializable

@Serializable
data class OpdsWebPublicationLink(
    val rel: String? = null,
    val href: String,
)